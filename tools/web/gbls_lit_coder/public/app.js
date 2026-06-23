const state = {
  manifest: [],
  lexicon: [],
  rubricDefinition: null,
  article: null,
  usercode: localStorage.getItem("gbl-usercode") || "",
  codings: [],
  currentView: "summary",
  reviewArticleId: null,
  selectedLexicon: new Set(),
  requestedArticleId: new URLSearchParams(location.search).get("article"),
  metricsReturnUrl: null,
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const rubricDimensions = () => state.rubricDefinition?.dimensions || [];
const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);

function getMetricsReturnUrl() {
  const value = new URLSearchParams(location.search).get("return");
  if (!value) return null;
  try {
    const url = new URL(value, location.href);
    const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);
    const allowedOrigin = url.origin === location.origin
      || (localHosts.has(url.hostname) && localHosts.has(location.hostname));
    return allowedOrigin && url.pathname.includes("/metrics_explorer/")
      ? url.href
      : null;
  } catch {
    return null;
  }
}

async function api(path, options) {
  const response = await fetch(path, options);
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${response.status})`);
  }
  return response.json();
}

async function loadStaticData() {
  const [manifest, catalog, lexicon, rubricMarkdown] = await Promise.all([
    fetch("/data/manifest.json").then((r) => r.json()),
    fetch("/data/catalog.json").then((r) => r.json()),
    fetch("/data/lexicon.json").then((r) => r.json()),
    fetch("/summary_quality_rubric.md").then((r) => {
      if (!r.ok) throw new Error("Summary quality rubric could not be loaded.");
      return r.text();
    }),
  ]);
  const rubricMatch = rubricMarkdown.match(/```json rubric\s*([\s\S]*?)```/);
  if (!rubricMatch) throw new Error("Summary quality rubric definition is missing.");
  state.rubricDefinition = JSON.parse(rubricMatch[1]);
  if (!state.rubricDefinition.id || !state.rubricDefinition.version || !rubricDimensions().length) {
    throw new Error("Summary quality rubric definition is invalid.");
  }
  const available = new Map(manifest.articles.map((article) => [article.id, article]));
  state.manifest = catalog.articles.map((article) => ({
    ...article,
    ...(available.get(article.id) || {}),
    contentAvailable: available.has(article.id),
  }));
  state.lexicon = lexicon.filter(
    (group) => String(group.id).toLowerCase() !== "coding_confidence",
  );
}

function showView(name) {
  state.currentView = name;
  $("#login-view").hidden = Boolean(state.usercode);
  $("#code-view").hidden = !state.usercode || !["summary", "metadata"].includes(name);
  $("#summary-function").hidden = name !== "summary";
  $("#metadata-function").hidden = name !== "metadata";
  $("#review-view").hidden = !state.usercode || name !== "review";
  $$(".nav-button").forEach((button) => button.classList.toggle("active", button.dataset.view === name));
  if (name === "review" && state.usercode) loadReview();
}

async function loadKnownUsers() {
  try {
    const users = await api("/api/usercodes");
    $("#known-users").innerHTML = users
      .map((user) => `<button type="button" class="known-user" data-user="${escapeHtml(user)}">${escapeHtml(user)}</button>`)
      .join("");
  } catch {
    $("#known-users").innerHTML = '<span class="muted">Previously used codes appear after deployment.</span>';
  }
}

function login(usercode) {
  state.usercode = usercode.trim();
  localStorage.setItem("gbl-usercode", state.usercode);
  $("#active-user").textContent = state.usercode;
  showView(state.metricsReturnUrl ? "metadata" : "summary");
  if (!state.article) openRequestedOrRandomArticle();
}

function codingComplete(coding, codingFunction) {
  if (codingFunction === "summary") {
    return coding.rubricId === state.rubricDefinition.id
      && coding.rubricVersion === state.rubricDefinition.version
      && rubricDimensions().every((dimension) => Number.isFinite(coding.rubric?.[dimension.id]));
  }
  return coding.lexicon && typeof coding.lexicon === "object";
}

function randomUncodedArticle() {
  const codingFunction = state.currentView === "metadata" ? "metadata" : "summary";
  const coded = new Set(
    state.codings
      .filter((coding) =>
        coding.usercode.toLowerCase() === state.usercode.toLowerCase()
        && codingComplete(coding, codingFunction))
      .map((coding) => coding.articleId),
  );
  const available = state.manifest.filter((article) => article.contentAvailable);
  const pool = available.filter((article) => !coded.has(article.id));
  const candidates = pool.length ? pool : available;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

async function chooseRandomArticle() {
  const picked = randomUncodedArticle();
  if (!picked) return;
  await loadArticle(picked.id);
}

async function loadArticle(articleId) {
  const manifestArticle = state.manifest.find((article) => article.id === articleId);
  $("#article-citation").textContent = "Loading article...";
  if (!manifestArticle) {
    $("#article-citation").textContent =
      `Article ${articleId} is not available in this coder build. Rebuild the corpus data and reload this link.`;
    $("#article-position").textContent = "";
    $$(".coding-function").forEach((section) => { section.hidden = true; });
    return false;
  }
  if (!manifestArticle.contentAvailable) {
    const availableResponse = await fetch(`/data/articles/${articleId}.json`);
    if (availableResponse.ok) {
      state.article = await availableResponse.json();
      state.article.contentAvailable = true;
      showView(state.currentView);
      renderArticle();
      return true;
    }
    state.article = {
      id: manifestArticle.id,
      citation: manifestArticle.citation,
      summary: "The coded summary text is not available in this local corpus build.",
      sourceText:
        "The full extracted text is not available in this local corpus build. "
        + "Metadata may still be submitted for this article. Rebuild the corpus after Google Drive "
        + "has made all source and summary files available offline to restore full text and evidence.",
      evidence: {},
      contentAvailable: false,
    };
    showView(state.currentView);
    renderArticle();
    return true;
  }
  const response = await fetch(`/data/articles/${articleId}.json`);
  if (!response.ok) throw new Error(`Article ${articleId} could not be loaded.`);
  state.article = await response.json();
  showView(state.currentView);
  renderArticle();
  return true;
}

async function openRequestedOrRandomArticle() {
  if (state.requestedArticleId) {
    await loadArticle(state.requestedArticleId);
    return;
  }
  await chooseRandomArticle();
}

function renderHighlightedSource(start, end) {
  const text = state.article.sourceText;
  if (!Number.isInteger(start) || !Number.isInteger(end)) {
    $("#metadata-source-text").textContent = text;
    return;
  }
  $("#metadata-source-text").innerHTML =
    `${escapeHtml(text.slice(0, start))}<mark id="active-evidence">${escapeHtml(text.slice(start, end))}</mark>${escapeHtml(text.slice(end))}`;
  $("#active-evidence").scrollIntoView({ block: "center" });
}

function renderRubric() {
  $("#rubric-version").textContent =
    `${state.rubricDefinition.id} v${state.rubricDefinition.version}`;
  $("#rubric-form").innerHTML = rubricDimensions().map(
    (dimension) => `
      <fieldset class="rubric-row">
        <legend class="rubric-title">
          <strong>${escapeHtml(dimension.label)}</strong>
          <span class="muted">${escapeHtml(dimension.description)}</span>
        </legend>
        <div class="score-options">
          ${dimension.levels.map((level, index) => `
            <label class="score-option">
              <input type="radio" name="rubric-${dimension.id}" value="${index + 1}">
              <span><b>${index + 1}</b>${escapeHtml(level)}</span>
            </label>`).join("")}
        </div>
      </fieldset>`
  ).join("");
}

function renderLexicon(filter = "") {
  const query = filter.trim().toLowerCase();
  $("#lexicon-form").innerHTML = state.lexicon.map((group) => {
    const items = group.items.filter((item) => `${group.label} ${item.label} ${item.description}`.toLowerCase().includes(query));
    if (!items.length) return "";
    return `<section class="lexicon-group">
      <h3>${escapeHtml(group.label)}</h3>
      ${items.map((item) => {
        const key = `${group.id}.${item.id}`;
        const evidence = state.article.evidence[key] || [];
        return `<div class="lexicon-item">
          <label class="lexicon-label metadata-term" tabindex="0"
            title="${escapeHtml(item.description)}"
            data-definition="${escapeHtml(item.description)}">
            <input type="checkbox" name="lexicon" value="${escapeHtml(key)}" ${state.selectedLexicon.has(key) ? "checked" : ""}>
            <span><strong>${escapeHtml(item.label)}</strong></span>
          </label>
          <div class="evidence-list">
            ${evidence.length ? evidence.map((entry) => `
              <button class="evidence-quote ${entry.signal}" type="button" data-start="${entry.start}" data-end="${entry.end}">
                <span class="evidence-signal">${entry.signal === "questions" ? "Potential counter-signal" : "Potential support"}</span>
                <q>${escapeHtml(entry.quote)}</q>
              </button>`).join("") : '<span class="muted">No strong lexical lead found.</span>'}
          </div>
        </div>`;
      }).join("")}
    </section>`;
  }).join("");
}

function renderArticle() {
  const index = state.manifest.findIndex((item) => item.id === state.article.id);
  $("#article-position").textContent = `${index + 1} of ${state.manifest.length}`;
  $("#article-citation").textContent = state.article.citation;
  $$(".source-word-count").forEach((element) => {
    element.textContent = `${state.article.sourceText.split(/\s+/).length.toLocaleString()} words`;
  });
  $("#summary-source-text").textContent = state.article.sourceText;
  $("#summary-text").textContent = state.article.summary;
  $("#lexicon-search").value = "";
  const existing = state.codings.find(
    (coding) => coding.articleId === state.article.id
      && coding.usercode.toLowerCase() === state.usercode.toLowerCase(),
  );
  state.selectedLexicon = new Set();
  for (const group of state.lexicon) {
    for (const item of group.items) {
      if (existing?.lexicon?.[group.id]?.[item.id]) {
        state.selectedLexicon.add(`${group.id}.${item.id}`);
      }
    }
  }
  renderHighlightedSource();
  if (state.article.contentAvailable === false) {
    $("#rubric-form").innerHTML =
      '<p class="muted">Summary ratings are omitted because summary content is unavailable.</p>';
  } else {
    renderRubric();
    for (const dimension of rubricDimensions()) {
      const score = existing?.rubric?.[dimension.id];
      if (
        existing?.rubricId === state.rubricDefinition.id
        && existing?.rubricVersion === state.rubricDefinition.version
        && Number.isFinite(score)
      ) {
        const input = $(`input[name="rubric-${dimension.id}"][value="${score}"]`);
        if (input) input.checked = true;
      }
    }
  }
  renderLexicon();
  updateSummarySaveState();
  $("#summary-source-text").scrollTop = 0;
  $("#metadata-source-text").scrollTop = 0;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function updateSummarySaveState() {
  const complete = state.article?.contentAvailable !== false
    && rubricDimensions().every((dimension) => $(`input[name="rubric-${dimension.id}"]:checked`));
  $("#save-summary").disabled = !complete;
  $("#summary-save-status").textContent = complete
    ? "Ready to save these summary rankings."
    : `Complete all ${rubricDimensions().length} ratings to save.`;
}

function collectSummaryCoding() {
  return {
    articleId: state.article.id,
    usercode: state.usercode,
    codingFunction: "summary",
    rubric: Object.fromEntries(
    rubricDimensions().map((dimension) => [dimension.id, Number($(`input[name="rubric-${dimension.id}"]:checked`).value)])
    ),
    rubricId: state.rubricDefinition.id,
    rubricVersion: state.rubricDefinition.version,
    recordType: "human_coding",
  };
}

function collectMetadataCoding() {
  const lexicon = {};
  for (const group of state.lexicon) {
    lexicon[group.id] = Object.fromEntries(
      group.items.map((item) => [item.id, state.selectedLexicon.has(`${group.id}.${item.id}`)])
    );
  }
  return {
    articleId: state.article.id,
    usercode: state.usercode,
    codingFunction: "metadata",
    lexicon,
    recordType: "human_coding",
  };
}

async function saveAndNext(codingFunction) {
  const isSummary = codingFunction === "summary";
  const button = isSummary ? $("#save-summary") : $("#save-metadata");
  const status = isSummary ? $("#summary-save-status") : $("#metadata-save-status");
  button.disabled = true;
  status.textContent = "Saving...";
  try {
    const saved = await api("/api/codings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(isSummary ? collectSummaryCoding() : collectMetadataCoding()),
    });
    state.codings = state.codings.filter(
      (coding) => !(coding.articleId === saved.articleId && coding.usercode.toLowerCase() === saved.usercode.toLowerCase())
    );
    state.codings.push(saved);
    status.textContent = "Saved.";
    if (!isSummary && state.metricsReturnUrl) {
      location.assign(state.metricsReturnUrl);
      return;
    }
    await chooseRandomArticle();
  } catch (error) {
    status.textContent = error.message;
    button.disabled = false;
  }
}

const mean = (values) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
const sd = (values) => {
  if (!values.length) return null;
  const average = mean(values);
  return Math.sqrt(mean(values.map((value) => (value - average) ** 2)));
};
const number = (value) => value == null || Number.isNaN(value) ? "—" : value.toFixed(2);

function kappaFor(groupId, itemId) {
  const byArticle = new Map();
  for (const coding of state.codings) {
    const value = coding.lexicon?.[groupId]?.[itemId];
    if (typeof value !== "boolean") continue;
    if (!byArticle.has(coding.articleId)) byArticle.set(coding.articleId, []);
    byArticle.get(coding.articleId).push(value);
  }
  const subjects = [...byArticle.values()].filter((ratings) => ratings.length >= 2);
  if (subjects.length < 2) return { kappa: null, articles: subjects.length };
  let pairAgreements = 0;
  let totalPairs = 0;
  let yes = 0;
  let total = 0;
  for (const ratings of subjects) {
    const yesCount = ratings.filter(Boolean).length;
    const noCount = ratings.length - yesCount;
    pairAgreements += yesCount * (yesCount - 1) + noCount * (noCount - 1);
    totalPairs += ratings.length * (ratings.length - 1);
    yes += yesCount;
    total += ratings.length;
  }
  const observed = pairAgreements / totalPairs;
  const pYes = yes / total;
  const expected = pYes ** 2 + (1 - pYes) ** 2;
  return { kappa: expected === 1 ? null : (observed - expected) / (1 - expected), articles: subjects.length };
}

function renderReliability() {
  $("#reliability-table").innerHTML = state.lexicon.map((group) => `
    <section class="reliability-group">
      <h3>${escapeHtml(group.label)}</h3>
      ${group.items.map((item) => {
        const result = kappaFor(group.id, item.id);
        return `<div class="reliability-row">
          <span>${escapeHtml(item.label)}</span>
          <span>κ ${number(result.kappa)}</span>
          <span>${result.articles} articles</span>
        </div>`;
      }).join("")}
    </section>`).join("");
}

function renderReviewList(filter = "") {
  const query = filter.toLowerCase();
  const countByArticle = new Map();
  state.codings.forEach((coding) => countByArticle.set(coding.articleId, (countByArticle.get(coding.articleId) || 0) + 1));
  $("#review-article-list").innerHTML = state.manifest
    .filter((article) => article.citation.toLowerCase().includes(query))
    .map((article) => `
      <button class="review-article ${state.reviewArticleId === article.id ? "active" : ""}" data-article="${article.id}">
        ${escapeHtml(article.citation)}
        <small>${countByArticle.get(article.id) || 0} independent coding${countByArticle.get(article.id) === 1 ? "" : "s"}</small>
      </button>`).join("");
}

function flattenSelections(coding) {
  const selected = [];
  for (const group of state.lexicon) {
    for (const item of group.items) {
      if (coding.lexicon?.[group.id]?.[item.id]) selected.push(`${group.label}: ${item.label}`);
    }
  }
  return selected.join("; ");
}

function selectReviewArticle(articleId) {
  state.reviewArticleId = articleId;
  const article = state.manifest.find((item) => item.id === articleId);
  const records = state.codings.filter((coding) => coding.articleId === articleId);
  const currentRubricRecords = records.filter(
    (record) => record.rubricVersion === state.rubricDefinition.version
      && record.rubricId === state.rubricDefinition.id,
  );
  $("#review-citation").textContent = article?.citation || "Unknown article";
  const cards = [
    ["Independent codings", records.length.toString()],
    ["Current rubric", `${currentRubricRecords.length} using v${state.rubricDefinition.version}`],
    ...rubricDimensions().map((dimension) => {
      const values = currentRubricRecords.map((record) => record.rubric?.[dimension.id]).filter(Number.isFinite);
      return [dimension.label, `${number(mean(values))} avg / ${number(sd(values))} SD`];
    }),
  ];
  $("#metric-cards").innerHTML = cards.map(([label, value]) =>
    `<div class="metric-card"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`
  ).join("");
  $("#coding-table-wrap").innerHTML = records.length ? `
    <table>
      <thead><tr><th>Usercode</th><th>Rubric</th>${rubricDimensions().map((d) => `<th>${escapeHtml(d.label)}</th>`).join("")}<th>Selected lexicon items</th><th>Saved</th></tr></thead>
      <tbody>${records.map((record) => `
        <tr><td>${escapeHtml(record.usercode)}</td><td>${escapeHtml(
          record.rubricVersion
            ? `${record.rubricId || "unknown"} v${record.rubricVersion}`
            : record.rubric ? "Legacy / unversioned" : "Not scored"
        )}</td>${rubricDimensions().map((d) => `<td>${record.rubric?.[d.id] ?? "—"}</td>`).join("")}
        <td>${escapeHtml(flattenSelections(record) || "None")}</td><td>${escapeHtml(new Date(record.savedAt).toLocaleString())}</td></tr>`).join("")}</tbody>
    </table>` : '<p class="muted">No codings have been saved for this article.</p>';
  renderReviewList($("#article-search").value);
}

async function loadReview() {
  $("#review-citation").textContent = "Loading saved codings...";
  try {
    state.codings = await api("/api/codings");
    renderReviewList($("#article-search").value);
    renderReliability();
    selectReviewArticle(state.reviewArticleId || state.manifest[0]?.id);
  } catch (error) {
    $("#review-citation").textContent = error.message;
  }
}

function exportJson() {
  const blob = new Blob([JSON.stringify(state.codings, null, 2)], { type: "application/json" });
  const link = Object.assign(document.createElement("a"), {
    href: URL.createObjectURL(blob),
    download: `gbl-article-codings-${new Date().toISOString().slice(0, 10)}.json`,
  });
  link.click();
  URL.revokeObjectURL(link.href);
}

document.addEventListener("change", (event) => {
  if (event.target.matches('[name^="rubric-"]')) updateSummarySaveState();
  if (event.target.matches('input[name="lexicon"]')) {
    if (event.target.checked) state.selectedLexicon.add(event.target.value);
    else state.selectedLexicon.delete(event.target.value);
  }
});
document.addEventListener("click", (event) => {
  const quote = event.target.closest(".evidence-quote");
  if (quote) renderHighlightedSource(Number(quote.dataset.start), Number(quote.dataset.end));
  const knownUser = event.target.closest(".known-user");
  if (knownUser) login(knownUser.dataset.user);
  const reviewArticle = event.target.closest(".review-article");
  if (reviewArticle) selectReviewArticle(reviewArticle.dataset.article);
});
$("#login-form").addEventListener("submit", (event) => {
  event.preventDefault();
  login(new FormData(event.currentTarget).get("usercode"));
});
$("#change-user").addEventListener("click", () => {
  state.usercode = "";
  localStorage.removeItem("gbl-usercode");
  $("#active-user").textContent = "No user";
  showView("summary");
  loadKnownUsers();
});
$$(".nav-button").forEach((button) => button.addEventListener("click", () => showView(button.dataset.view)));
$("#random-article").addEventListener("click", chooseRandomArticle);
$("#save-summary").addEventListener("click", () => saveAndNext("summary"));
$("#save-metadata").addEventListener("click", () => saveAndNext("metadata"));
$("#lexicon-search").addEventListener("input", (event) => renderLexicon(event.target.value));
$("#article-search").addEventListener("input", (event) => renderReviewList(event.target.value));
$("#export-json").addEventListener("click", exportJson);

await loadStaticData();
state.metricsReturnUrl = getMetricsReturnUrl();
if (state.metricsReturnUrl) {
  const returnLink = $("#return-to-metrics");
  returnLink.href = state.metricsReturnUrl;
  returnLink.hidden = false;
}
try {
  state.codings = await api("/api/codings");
} catch {
  state.codings = [];
}
if (state.usercode) {
  $("#active-user").textContent = state.usercode;
  showView(state.metricsReturnUrl ? "metadata" : "summary");
  openRequestedOrRandomArticle();
} else {
  showView("summary");
  loadKnownUsers();
}
