(() => {
  "use strict";

  const data = window.GBLS_METRICS;
  const reference = window.GBLS_REFERENCE_CORPUS;
  if (!data || !Array.isArray(data.articles) || !Array.isArray(data.featureGroups)) {
    document.body.classList.add("data-error");
    const message = document.getElementById("dataError");
    if (message) message.hidden = false;
    return;
  }
  if (!reference || !Array.isArray(reference.articles)) {
    console.warn("Reference corpus did not load; rendering foreground metrics only.");
  }

  const referenceArticles = reference?.articles || [];
  const codingToolUrl = new URL(window.GBLS_CODING_TOOL_URL || "../", window.location.href);
  const featureGroups = data.featureGroups;
  const groupLabels = Object.fromEntries(featureGroups.map((group) => [group.key, group.label]));
  const articleColumns = Object.fromEntries(
    featureGroups.map((group) => [group.key, group.column || group.key]),
  );
  const allYears = [...new Set([...(data.years || []), ...(reference?.years || [])])]
    .map(Number).filter(Number.isFinite).sort((a, b) => a - b);
  const defaultGroup = featureGroups.find((group) => group.key === "service_area")?.key
    || featureGroups[0]?.key;
  const state = {
    group: defaultGroup,
    limit: 15,
    yearStart: allYears[0],
    yearEnd: allYears[allYears.length - 1],
    selectedFeature: null,
    search: "",
  };

  const $ = (id) => document.getElementById(id);
  const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  const pretty = (value) => String(value || "").replaceAll("_", " ");
  const splitLabels = (value) => String(value || "").split("|").filter(Boolean);
  const pct = (count, total) => total ? count / total * 100 : 0;
  const pctLabel = (value) => `${value < 10 ? value.toFixed(1) : value.toFixed(0)}%`;
  const svgEl = (name, attributes = {}) => {
    const node = document.createElementNS("http://www.w3.org/2000/svg", name);
    Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
    return node;
  };
  const addTitle = (node, text) => {
    const title = svgEl("title");
    title.textContent = text;
    node.append(title);
  };

  function renderSummary() {
    $("datasetSubtitle").textContent =
      `Compare ${data.summary.total_articles.toLocaleString()} curated GBLS sources with `
      + `${referenceArticles.length.toLocaleString()} abstract-coded journal articles.`;
    const earliest = Math.min(data.summary.earliest_year, reference?.summary?.earliest_year || Infinity);
    const latest = Math.max(data.summary.latest_year, reference?.summary?.latest_year || -Infinity);
    const metrics = [
      ["GBLS corpus", data.summary.total_articles.toLocaleString()],
      ["Reference corpus", referenceArticles.length.toLocaleString()],
      ["GBLS coded labels", data.summary.unique_feature_labels.toLocaleString()],
      ["Combined publication span", `${earliest}-${latest}`],
    ];
    $("summaryCards").innerHTML = metrics.map(([label, value]) => `
      <article class="summary-card">
        <span class="summary-value">${escapeHtml(value)}</span>
        <span class="summary-label">${escapeHtml(label)}</span>
      </article>
    `).join("");
  }

  function setupControls() {
    $("groupSelect").innerHTML = featureGroups
      .map((group) => `<option value="${escapeHtml(group.key)}">${escapeHtml(group.label)}</option>`)
      .join("");
    const yearOptions = allYears.map((year) => `<option value="${year}">${year}</option>`).join("");
    $("yearStart").innerHTML = yearOptions;
    $("yearEnd").innerHTML = yearOptions;
    $("groupSelect").value = state.group;
    $("yearStart").value = state.yearStart;
    $("yearEnd").value = state.yearEnd;

    $("groupSelect").addEventListener("change", (event) => {
      state.group = event.target.value;
      state.selectedFeature = null;
      renderAll();
    });
    $("limitSelect").addEventListener("change", (event) => {
      state.limit = Number(event.target.value);
      renderRanking();
    });
    $("yearStart").addEventListener("change", (event) => {
      state.yearStart = Math.min(Number(event.target.value), state.yearEnd);
      $("yearStart").value = state.yearStart;
      renderAll();
    });
    $("yearEnd").addEventListener("change", (event) => {
      state.yearEnd = Math.max(Number(event.target.value), state.yearStart);
      $("yearEnd").value = state.yearEnd;
      renderAll();
    });
    $("articleSearch").addEventListener("input", (event) => {
      state.search = event.target.value.trim().toLowerCase();
      renderArticles();
    });
    $("clearFeatureButton").addEventListener("click", () => {
      state.selectedFeature = null;
      renderAll();
    });
    $("resetButton").addEventListener("click", () => {
      state.group = defaultGroup;
      state.limit = 15;
      state.yearStart = allYears[0];
      state.yearEnd = allYears[allYears.length - 1];
      state.selectedFeature = null;
      state.search = "";
      $("groupSelect").value = state.group;
      $("limitSelect").value = "15";
      $("yearStart").value = state.yearStart;
      $("yearEnd").value = state.yearEnd;
      $("articleSearch").value = "";
      renderAll();
    });
  }

  function inRange(articles) {
    return articles.filter((article) => {
      if (article.year === null || article.year === undefined || article.year === "") return true;
      const year = Number(article.year);
      return !Number.isFinite(year) || (year >= state.yearStart && year <= state.yearEnd);
    });
  }

  function featureCounts(articles) {
    const counts = new Map();
    const column = articleColumns[state.group] || state.group;
    for (const article of articles) {
      new Set(splitLabels(article[column])).forEach(
        (value) => counts.set(value, (counts.get(value) || 0) + 1),
      );
    }
    return counts;
  }

  function rankingRows() {
    const foreground = inRange(data.articles);
    const background = inRange(referenceArticles);
    const foregroundCounts = featureCounts(foreground);
    const referenceCounts = featureCounts(background);
    return [...new Set([...foregroundCounts.keys(), ...referenceCounts.keys()])]
      .map((feature) => ({
        feature,
        foregroundCount: foregroundCounts.get(feature) || 0,
        referenceCount: referenceCounts.get(feature) || 0,
        foregroundPct: pct(foregroundCounts.get(feature) || 0, foreground.length),
        referencePct: pct(referenceCounts.get(feature) || 0, background.length),
      }))
      .sort((a, b) => b.foregroundCount - a.foregroundCount
        || b.referenceCount - a.referenceCount || a.feature.localeCompare(b.feature));
  }

  function renderRanking() {
    const rows = rankingRows().slice(0, state.limit);
    $("rankingTitle").textContent = `${groupLabels[state.group]} prevalence`;
    const width = 980;
    const labelWidth = 220;
    const rowHeight = 34;
    const plotWidth = 530;
    const height = Math.max(160, rows.length * rowHeight + 24);
    const max = Math.max(...rows.flatMap((row) => [row.foregroundPct, row.referencePct]), 1);
    const svg = svgEl("svg", { viewBox: `0 0 ${width} ${height}`, role: "img" });

    rows.forEach((row, index) => {
      const y = index * rowHeight + 7;
      const referenceWidth = row.referencePct / max * plotWidth;
      const foregroundWidth = row.foregroundPct / max * plotWidth;
      const group = svgEl("g", {
        class: `bar-row${state.selectedFeature === row.feature ? " is-selected" : ""}`,
        tabindex: "0", role: "button",
        "aria-label": `${pretty(row.feature)}. GBLS ${row.foregroundCount}, ${pctLabel(row.foregroundPct)}. `
          + `Reference ${row.referenceCount}, ${pctLabel(row.referencePct)}.`,
      });
      const label = svgEl("text", {
        x: labelWidth - 10, y: y + 18, "text-anchor": "end", class: "bar-label",
      });
      label.textContent = pretty(row.feature);
      const referenceBar = svgEl("rect", {
        x: labelWidth, y, width: Math.max(row.referenceCount ? 2 : 0, referenceWidth),
        height: 22, rx: 4, class: "reference-bar",
      });
      const foregroundBar = svgEl("rect", {
        x: labelWidth, y: y + 6, width: Math.max(row.foregroundCount ? 2 : 0, foregroundWidth),
        height: 10, rx: 3, class: "foreground-bar",
      });
      addTitle(referenceBar, `Reference: ${row.referenceCount} articles (${pctLabel(row.referencePct)})`);
      addTitle(foregroundBar, `GBLS: ${row.foregroundCount} articles (${pctLabel(row.foregroundPct)})`);
      const foregroundValue = svgEl("text", {
        x: labelWidth + plotWidth + 12, y: y + 12, class: "bar-value",
      });
      foregroundValue.textContent = `GBLS ${row.foregroundCount} · ${pctLabel(row.foregroundPct)}`;
      const referenceValue = svgEl("text", {
        x: labelWidth + plotWidth + 12, y: y + 26, class: "reference-value",
      });
      referenceValue.textContent = `Ref ${row.referenceCount} · ${pctLabel(row.referencePct)}`;
      const select = () => {
        state.selectedFeature = state.selectedFeature === row.feature ? null : row.feature;
        renderAll();
      };
      group.addEventListener("click", select);
      group.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          select();
        }
      });
      group.append(label, referenceBar, foregroundBar, foregroundValue, referenceValue);
      svg.append(group);
    });
    $("rankingChart").replaceChildren(svg);
  }

  function renderComparisonChart(container, rows, percentAxis = true) {
    const width = 760;
    const height = 290;
    const margin = { top: 14, right: 12, bottom: 50, left: 50 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;
    const max = Math.max(...rows.flatMap((row) => [row.foregroundValue, row.referenceValue]), 1);
    const svg = svgEl("svg", { viewBox: `0 0 ${width} ${height}`, role: "img" });
    [0, 0.5, 1].forEach((ratio) => {
      const y = margin.top + plotHeight * (1 - ratio);
      svg.append(svgEl("line", {
        x1: margin.left, x2: width - margin.right, y1: y, y2: y, class: "grid-line",
      }));
      const tick = svgEl("text", {
        x: margin.left - 8, y: y + 4, "text-anchor": "end", class: "axis-label",
      });
      tick.textContent = percentAxis ? pctLabel(max * ratio) : Math.round(max * ratio);
      svg.append(tick);
    });
    const slot = plotWidth / Math.max(rows.length, 1);
    rows.forEach((row, index) => {
      const x = margin.left + index * slot + slot * 0.12;
      const referenceHeight = row.referenceValue / max * plotHeight;
      const foregroundHeight = row.foregroundValue / max * plotHeight;
      const referenceBar = svgEl("rect", {
        x, y: margin.top + plotHeight - referenceHeight,
        width: Math.max(2, slot * 0.76), height: referenceHeight, rx: 2, class: "reference-bar",
      });
      const foregroundBar = svgEl("rect", {
        x: x + slot * 0.23, y: margin.top + plotHeight - foregroundHeight,
        width: Math.max(2, slot * 0.30), height: foregroundHeight, rx: 2, class: "foreground-bar",
      });
      addTitle(referenceBar, `Reference ${row.label}: ${row.referenceCount} (${pctLabel(row.referenceValue)})`);
      addTitle(foregroundBar, `GBLS ${row.label}: ${row.foregroundCount} (${pctLabel(row.foregroundValue)})`);
      svg.append(referenceBar, foregroundBar);
      if (rows.length <= 25 || index % Math.ceil(rows.length / 24) === 0) {
        const label = svgEl("text", {
          x: x + slot * 0.38, y: height - 24, "text-anchor": "middle",
          class: "axis-label", transform: `rotate(-45 ${x + slot * 0.38} ${height - 24})`,
        });
        label.textContent = row.label;
        svg.append(label);
      }
    });
    container.replaceChildren(svg);
  }

  function renderYears() {
    const foreground = inRange(data.articles).filter((article) => Number.isFinite(Number(article.year)));
    const background = inRange(referenceArticles).filter((article) => Number.isFinite(Number(article.year)));
    const foregroundCounts = new Map();
    const referenceCounts = new Map();
    foreground.forEach((article) => foregroundCounts.set(Number(article.year), (foregroundCounts.get(Number(article.year)) || 0) + 1));
    background.forEach((article) => referenceCounts.set(Number(article.year), (referenceCounts.get(Number(article.year)) || 0) + 1));
    const rows = allYears.filter((year) => year >= state.yearStart && year <= state.yearEnd)
      .map((year) => {
        const foregroundCount = foregroundCounts.get(year) || 0;
        const referenceCount = referenceCounts.get(year) || 0;
        return {
          label: String(year), foregroundCount, referenceCount,
          foregroundValue: pct(foregroundCount, foreground.length),
          referenceValue: pct(referenceCount, background.length),
        };
      });
    renderComparisonChart($("yearChart"), rows);
  }

  function yearlyFeatureRows(feature) {
    const column = articleColumns[state.group] || state.group;
    return allYears.filter((year) => year >= state.yearStart && year <= state.yearEnd).map((year) => {
      const foregroundYear = data.articles.filter((article) => Number(article.year) === year);
      const referenceYear = referenceArticles.filter((article) => Number(article.year) === year);
      const foregroundCount = foregroundYear.filter(
        (article) => splitLabels(article[column]).includes(feature),
      ).length;
      const referenceCount = referenceYear.filter(
        (article) => splitLabels(article[column]).includes(feature),
      ).length;
      return {
        label: String(year), foregroundCount, referenceCount,
        foregroundValue: pct(foregroundCount, foregroundYear.length),
        referenceValue: pct(referenceCount, referenceYear.length),
      };
    });
  }

  function renderTrend() {
    const container = $("trendChart");
    if (!state.selectedFeature) {
      $("trendEmpty").hidden = false;
      container.replaceChildren();
      $("trendTitle").textContent = "Selected feature over time";
      return;
    }
    $("trendEmpty").hidden = true;
    $("trendTitle").textContent = `${pretty(state.selectedFeature)} prevalence over time`;
    renderComparisonChart(container, yearlyFeatureRows(state.selectedFeature));
  }

  function hasSelectedFeature(article) {
    if (!state.selectedFeature) return true;
    const column = articleColumns[state.group] || state.group;
    return splitLabels(article[column]).includes(state.selectedFeature);
  }

  function renderTags(value, max = 4) {
    const labels = splitLabels(value);
    const visible = labels.slice(0, max);
    if (labels.length > max) visible.push(`+${labels.length - max}`);
    return `<div class="tag-list">${visible.map(
      (label) => `<span class="tag">${escapeHtml(pretty(label))}</span>`,
    ).join("")}</div>`;
  }

  function valuesFor(article, preferredKey, fallback = "") {
    const key = featureGroups.find((group) => group.key === preferredKey)?.column;
    return key ? article[key] : fallback;
  }

  function renderArticles() {
    const filtered = inRange(data.articles).filter((article) => {
      if (!hasSelectedFeature(article)) return false;
      if (!state.search) return true;
      return Object.values(article).join(" ").toLowerCase().includes(state.search);
    });
    $("articleCount").textContent = `${filtered.length} GBLS`;
    $("activeFilter").hidden = !state.selectedFeature;
    $("activeFilter").textContent = state.selectedFeature
      ? `GBLS sources filtered to ${groupLabels[state.group]}: ${pretty(state.selectedFeature)}`
      : "";
    $("articleRows").innerHTML = filtered.slice(0, 250).map((article) => {
      const codingUrl = new URL(codingToolUrl);
      codingUrl.searchParams.set("article", article.article_id);
      codingUrl.searchParams.set("return", window.location.href);
      return `
      <tr>
        <td>${escapeHtml(article.year || "n.d.")}</td>
        <td class="citation-cell">
          <a class="citation-link" href="${escapeHtml(codingUrl.href)}">${escapeHtml(article.citation)}</a>
        </td>
        <td>${renderTags(valuesFor(article, "library_context"), 3)}</td>
        <td>${renderTags(valuesFor(article, "game_format"), 4)}</td>
        <td>${renderTags(valuesFor(article, "service_area"), 5)}</td>
        <td>${renderTags(valuesFor(article, "intended_outcome"), 5)}</td>
        <td><a class="code-article-link" href="${escapeHtml(codingUrl.href)}">Code metadata</a></td>
      </tr>
    `;
    }).join("");
  }

  function renderAll() {
    renderRanking();
    renderYears();
    renderTrend();
    renderArticles();
  }

  function renderMeta() {
    const meta = window.GBLS_META;
    const el = document.getElementById("dataBuildInfo");
    if (!el || !meta) return;
    const date = new Date(meta.generated_at);
    const dateStr = date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    const timeStr = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    el.textContent = `Data built ${dateStr} at ${timeStr} · commit ${meta.git_commit}`;
  }

  renderSummary();
  renderMeta();
  setupControls();
  renderAll();
})();
