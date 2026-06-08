(() => {
  "use strict";

  const data = window.GBLS_METRICS;
  if (!data || !Array.isArray(data.articles) || !Array.isArray(data.featureGroups)) {
    document.body.classList.add("data-error");
    const message = document.getElementById("dataError");
    if (message) message.hidden = false;
    console.error(
      "GBLS metrics data did not load. Rebuild 2-outputs/metrics with prompt-library/calculate_summary_metrics.md.",
    );
    return;
  }

  const featureGroups = data.featureGroups;
  const groupLabels = Object.fromEntries(
    featureGroups.map((group) => [group.key, group.label]),
  );
  const articleColumns = Object.fromEntries(
    featureGroups.map((group) => [group.key, group.column || group.key]),
  );
  const defaultGroup = featureGroups.find((group) => group.key === "service_area")?.key
    || featureGroups[0]?.key;
  const state = {
    group: defaultGroup,
    limit: 15,
    yearStart: data.years[0],
    yearEnd: data.years[data.years.length - 1],
    selectedFeature: null,
    search: "",
  };

  const $ = (id) => document.getElementById(id);
  const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
  const pretty = (value) => String(value || "").replaceAll("_", " ");
  const splitLabels = (value) => String(value || "").split("|").filter(Boolean);
  const svgEl = (name, attributes = {}) => {
    const node = document.createElementNS("http://www.w3.org/2000/svg", name);
    Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
    return node;
  };

  function renderSummary() {
    $("datasetSubtitle").textContent =
      `Explore ${data.summary.total_articles.toLocaleString()} coded source summaries by ${featureGroups.map((group) => group.label.toLowerCase()).join(", ")} and year.`;
    const metrics = [
      ["Articles", data.summary.total_articles.toLocaleString()],
      ["Coded labels", data.summary.unique_feature_labels.toLocaleString()],
      ["Feature assignments", data.summary.total_article_feature_assignments.toLocaleString()],
      ["Publication span", `${data.summary.earliest_year}-${data.summary.latest_year}`],
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
    const yearOptions = data.years.map((year) => `<option value="${year}">${year}</option>`).join("");
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
      state.yearStart = data.years[0];
      state.yearEnd = data.years[data.years.length - 1];
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

  function articlesInRange() {
    return data.articles.filter((article) => {
      if (article.year === null || article.year === undefined || article.year === "") return true;
      const year = Number(article.year);
      return !Number.isFinite(year) || (year >= state.yearStart && year <= state.yearEnd);
    });
  }

  function currentCounts() {
    const counts = new Map();
    for (const article of articlesInRange()) {
      const values = splitLabels(article[articleColumns[state.group]]);
      new Set(values).forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
    }
    return [...counts.entries()]
      .map(([feature_value, article_count]) => ({ feature_value, article_count }))
      .sort((a, b) => b.article_count - a.article_count || a.feature_value.localeCompare(b.feature_value));
  }

  function renderRanking() {
    const rows = currentCounts().slice(0, state.limit);
    $("rankingTitle").textContent = `${groupLabels[state.group]} popularity`;
    const width = 820;
    const labelWidth = 210;
    const rowHeight = 28;
    const height = Math.max(150, rows.length * rowHeight + 30);
    const max = Math.max(...rows.map((row) => row.article_count), 1);
    const svg = svgEl("svg", { viewBox: `0 0 ${width} ${height}`, role: "img" });

    rows.forEach((row, index) => {
      const y = index * rowHeight + 8;
      const barWidth = (row.article_count / max) * (width - labelWidth - 70);
      const group = svgEl("g", {
        class: `bar-row${state.selectedFeature === row.feature_value ? " is-selected" : ""}`,
        tabindex: "0",
        role: "button",
        "aria-label": `${pretty(row.feature_value)}, ${row.article_count} articles`,
      });
      const label = svgEl("text", { x: labelWidth - 9, y: y + 16, "text-anchor": "end", class: "bar-label" });
      label.textContent = pretty(row.feature_value);
      const bar = svgEl("rect", {
        x: labelWidth, y, width: Math.max(2, barWidth), height: 20, rx: 4, fill: "#126782",
      });
      const value = svgEl("text", { x: labelWidth + barWidth + 8, y: y + 15, class: "bar-value" });
      value.textContent = row.article_count;
      const select = () => {
        state.selectedFeature = state.selectedFeature === row.feature_value ? null : row.feature_value;
        renderAll();
      };
      group.addEventListener("click", select);
      group.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          select();
        }
      });
      group.append(label, bar, value);
      svg.append(group);
    });
    $("rankingChart").replaceChildren(svg);
  }

  function renderColumnChart(container, rows) {
    const width = 700;
    const height = 275;
    const margin = { top: 14, right: 12, bottom: 48, left: 42 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;
    const max = Math.max(...rows.map((row) => row.value), 1);
    const svg = svgEl("svg", { viewBox: `0 0 ${width} ${height}`, role: "img" });
    [0, 0.5, 1].forEach((ratio) => {
      const y = margin.top + plotHeight * (1 - ratio);
      svg.append(svgEl("line", { x1: margin.left, x2: width - margin.right, y1: y, y2: y, class: "grid-line" }));
      const tick = svgEl("text", { x: margin.left - 8, y: y + 4, "text-anchor": "end", class: "axis-label" });
      tick.textContent = Math.round(max * ratio);
      svg.append(tick);
    });
    const slot = plotWidth / Math.max(rows.length, 1);
    rows.forEach((row, index) => {
      const barHeight = (row.value / max) * plotHeight;
      const x = margin.left + index * slot + slot * 0.14;
      const y = margin.top + plotHeight - barHeight;
      svg.append(svgEl("rect", {
        x, y, width: Math.max(2, slot * 0.72), height: barHeight, rx: 2, fill: "#126782",
      }));
      if (rows.length <= 25 || index % 2 === 0) {
        const label = svgEl("text", {
          x: x + slot * 0.36, y: height - 24, "text-anchor": "middle",
          class: "axis-label", transform: `rotate(-45 ${x + slot * 0.36} ${height - 24})`,
        });
        label.textContent = row.label;
        svg.append(label);
      }
    });
    container.replaceChildren(svg);
  }

  function renderYears() {
    const counts = new Map(
      data.publicationYears
        .filter((row) => row.year_label !== "n.d.")
        .map((row) => [Number(row.year_label), row.article_count]),
    );
    const rows = data.years
      .filter((year) => year >= state.yearStart && year <= state.yearEnd)
      .map((year) => ({ label: String(year), value: counts.get(year) || 0 }));
    renderColumnChart($("yearChart"), rows);
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
    $("trendTitle").textContent = `${pretty(state.selectedFeature)} over time`;
    const lookup = new Map(
      data.featureYears
        .filter((row) => row.feature_group === state.group && row.feature_value === state.selectedFeature)
        .map((row) => [Number(row.year), row.article_count]),
    );
    const rows = data.years
      .filter((year) => year >= state.yearStart && year <= state.yearEnd)
      .map((year) => ({ label: String(year), value: lookup.get(year) || 0 }));
    renderColumnChart(container, rows);
  }

  function hasSelectedFeature(article) {
    if (!state.selectedFeature) return true;
    return splitLabels(article[articleColumns[state.group]]).includes(state.selectedFeature);
  }

  function renderTags(value, max = 4) {
    const labels = splitLabels(value);
    const visible = labels.slice(0, max);
    if (labels.length > max) visible.push(`+${labels.length - max}`);
    return `<div class="tag-list">${visible.map((label) => `<span class="tag">${escapeHtml(pretty(label))}</span>`).join("")}</div>`;
  }

  function valuesFor(article, preferredKey, fallback = "") {
    const key = featureGroups.find((group) => group.key === preferredKey)?.column;
    return key ? article[key] : fallback;
  }

  function renderArticles() {
    const filtered = articlesInRange().filter((article) => {
      if (!hasSelectedFeature(article)) return false;
      if (!state.search) return true;
      return Object.values(article).join(" ").toLowerCase().includes(state.search);
    });
    $("articleCount").textContent = filtered.length;
    $("activeFilter").hidden = !state.selectedFeature;
    $("activeFilter").textContent = state.selectedFeature
      ? `Filtered to ${groupLabels[state.group]}: ${pretty(state.selectedFeature)}`
      : "";
    $("articleRows").innerHTML = filtered.slice(0, 250).map((article) => `
      <tr>
        <td>${escapeHtml(article.year || "n.d.")}</td>
        <td class="citation-cell">${escapeHtml(article.citation)}</td>
        <td>${renderTags(valuesFor(article, "library_context"), 3)}</td>
        <td>${renderTags(valuesFor(article, "game_format"), 4)}</td>
        <td>${renderTags(valuesFor(article, "service_area"), 5)}</td>
        <td>${renderTags(valuesFor(article, "intended_outcome"), 5)}</td>
      </tr>
    `).join("");
  }

  function renderAll() {
    renderRanking();
    renderYears();
    renderTrend();
    renderArticles();
  }

  renderSummary();
  setupControls();
  renderAll();
})();
