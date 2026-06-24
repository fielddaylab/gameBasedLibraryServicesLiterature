// GBLS Literature Reviewer - Unified Frontend Application
// Combines metrics explorer and lit_coder functionality

// Global State
const state = {
  metrics: null,
  articles: [],
  codings: [],
  summaries: [],
  currentTab: 'metrics',
  currentArticle: null,
  
  // Metrics state
  metricsState: {
    group: 'service_area',
    limit: 15,
    yearStart: 1950,
    yearEnd: 2025,
    selectedFeature: null,
    search: ''
  },

  // Summaries state
  summariesState: {
    usercode: localStorage.getItem('summaries_usercode') || '',
    currentArticle: null
  },

  // Classification state
  classifyState: {
    usercode: localStorage.getItem('classify_usercode') || '',
    currentArticle: null,
    rubricDefinition: null,
    lexicon: null
  }
};

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
  setupTabs();
  await loadInitialData();
  renderMetricsTab();
});

// Tab Management
function setupTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      const tabName = e.target.dataset.tab;
      switchTab(tabName);
    });
  });
}

function switchTab(tabName) {
  // Update button states
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });

  // Update pane visibility
  document.querySelectorAll('.tab-pane').forEach(pane => {
    pane.classList.toggle('active', pane.id === tabName);
  });

  state.currentTab = tabName;

  // Initialize tab content
  if (tabName === 'metrics') {
    renderMetricsTab();
  } else if (tabName === 'summaries') {
    initializeSummariesTab();
  } else if (tabName === 'classify') {
    initializeClassifyTab();
  } else if (tabName === 'view') {
    loadAllClassifications();
  }
}

// Data Loading
async function loadInitialData() {
  try {
    // Load metrics
    const metricsRes = await fetch('/api/metrics');
    if (metricsRes.ok) {
      state.metrics = await metricsRes.json();
    }

    // Load articles
    const articlesRes = await fetch('/api/articles');
    if (articlesRes.ok) {
      state.articles = await articlesRes.json();
    }

    // Load codings
    const codingsRes = await fetch('/api/codings');
    if (codingsRes.ok) {
      state.codings = await codingsRes.json();
    }

    // Load summaries
    const summariesRes = await fetch('/api/summaries');
    if (summariesRes.ok) {
      state.summaries = await summariesRes.json();
    }
  } catch (error) {
    console.error('Error loading initial data:', error);
  }
}

// ============================================================================
// TAB 1: METRICS EXPLORER
// ============================================================================

function renderMetricsTab() {
  if (!state.metrics || !state.metrics.summary) return;

  renderMetricsSummary();
  populateFeatureSelect();
  setupMetricsControls();
  renderMetricsCharts();
  renderArticlesTable();
}

function renderMetricsSummary() {
  const summary = state.metrics.summary;
  document.getElementById('total-articles').textContent = summary.total_articles || '—';
  document.getElementById('year-range').textContent = `${summary.earliest_year || '?'} - ${summary.latest_year || '?'}`;
  document.getElementById('unique-features').textContent = summary.unique_feature_labels || '—';
  document.getElementById('avg-features').textContent = summary.mean_features_per_article?.toFixed(1) || '—';
}

function populateFeatureSelect() {
  const select = document.getElementById('feature-select');
  if (!state.metrics || !state.metrics.featureGroups) return;

  const existing = select.options.length > 1;
  state.metrics.featureGroups.forEach(group => {
    if (existing && Array.from(select.options).some(o => o.value === group.key)) return;
    const option = document.createElement('option');
    option.value = group.key;
    option.textContent = group.label;
    select.appendChild(option);
  });
}

function setupMetricsControls() {
  document.getElementById('feature-select').addEventListener('change', (e) => {
    state.metricsState.group = e.target.value;
    renderMetricsCharts();
  });

  document.getElementById('limit-select').addEventListener('change', (e) => {
    state.metricsState.limit = e.target.value === 'all' ? 999 : parseInt(e.target.value);
    renderMetricsCharts();
  });

  document.getElementById('year-from').addEventListener('change', (e) => {
    state.metricsState.yearStart = parseInt(e.target.value) || 1950;
    renderMetricsCharts();
  });

  document.getElementById('year-to').addEventListener('change', (e) => {
    state.metricsState.yearEnd = parseInt(e.target.value) || 2025;
    renderMetricsCharts();
  });

  document.getElementById('metrics-reset').addEventListener('click', () => {
    state.metricsState = {
      group: 'service_area',
      limit: 15,
      yearStart: 1950,
      yearEnd: 2025,
      selectedFeature: null,
      search: ''
    };
    document.getElementById('feature-select').value = 'service_area';
    document.getElementById('limit-select').value = '15';
    document.getElementById('year-from').value = '1950';
    document.getElementById('year-to').value = '2025';
    document.getElementById('article-search').value = '';
    renderMetricsCharts();
    renderArticlesTable();
  });

  document.getElementById('article-search').addEventListener('input', (e) => {
    state.metricsState.search = e.target.value.toLowerCase();
    renderArticlesTable();
  });
}

function renderMetricsCharts() {
  if (!state.metrics || !state.metrics.articles) return;

  // Filter articles by year
  const filtered = state.metrics.articles.filter(a => 
    a.year >= state.metricsState.yearStart && a.year <= state.metricsState.yearEnd
  );

  // Get feature counts
  const featureCounts = {};
  filtered.forEach(article => {
    const featureValue = article[state.metricsState.group];
    if (featureValue) {
      const features = Array.isArray(featureValue) ? featureValue : featureValue.split('|');
      features.forEach(f => {
        f = f.trim();
        featureCounts[f] = (featureCounts[f] || 0) + 1;
      });
    }
  });

  // Sort and limit
  const sorted = Object.entries(featureCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, state.metricsState.limit);

  renderRankingChart(sorted);
  renderYearChart(filtered);
}

function renderRankingChart(data) {
  const container = document.getElementById('ranking-chart');
  if (!data || data.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: var(--text-light);">No data available</p>';
    return;
  }

  const maxValue = Math.max(...data.map(d => d[1]));
  const html = data.map(([label, count], i) => {
    const percent = (count / maxValue) * 100;
    return `
      <div class="rank-item" onclick="selectMetricsFeature('${label}')">
        <div class="rank-label">${label}</div>
        <div class="rank-bar" style="width: ${percent}%"></div>
        <div class="rank-value">${count}</div>
      </div>
    `;
  }).join('');

  container.innerHTML = html;
  
  // Add styles if not already added
  if (!document.getElementById('ranking-styles')) {
    const style = document.createElement('style');
    style.id = 'ranking-styles';
    style.textContent = `
      .rank-item {
        display: grid;
        grid-template-columns: 150px 1fr 50px;
        gap: 1rem;
        align-items: center;
        margin-bottom: 1rem;
        cursor: pointer;
        padding: 0.5rem;
        border-radius: 0.25rem;
        transition: background-color 0.2s;
      }
      .rank-item:hover {
        background-color: var(--light-bg);
      }
      .rank-label {
        font-size: 0.875rem;
        font-weight: 500;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .rank-bar {
        background: linear-gradient(90deg, var(--primary-color), #60a5fa);
        height: 24px;
        border-radius: 0.25rem;
      }
      .rank-value {
        text-align: right;
        font-weight: 600;
        color: var(--text-dark);
      }
    `;
    document.head.appendChild(style);
  }
}

function renderYearChart(articles) {
  const container = document.getElementById('year-chart');
  const yearCounts = {};
  
  articles.forEach(a => {
    yearCounts[a.year] = (yearCounts[a.year] || 0) + 1;
  });

  const sorted = Object.entries(yearCounts)
    .map(([year, count]) => [parseInt(year), count])
    .sort((a, b) => a[0] - b[0]);

  if (sorted.length === 0) {
    container.innerHTML = '<p style="text-align: center;">No data</p>';
    return;
  }

  const maxCount = Math.max(...sorted.map(d => d[1]));
  const width = Math.min(Math.max(sorted.length * 30, 400), 800);
  const html = sorted.map(([year, count]) => {
    const height = (count / maxCount) * 150;
    return `<div style="display: inline-block; width: ${width / sorted.length}px; text-align: center; margin: 0 2px;">
      <div style="height: ${height}px; background: linear-gradient(180deg, #60a5fa, var(--primary-color)); border-radius: 0.25rem 0.25rem 0 0;"></div>
      <small style="font-size: 0.75rem; color: var(--text-light);">${year}</small>
    </div>`;
  }).join('');

  container.innerHTML = html;
}

function selectMetricsFeature(feature) {
  state.metricsState.selectedFeature = feature;
  const trendSection = document.getElementById('trend-section');
  document.getElementById('trend-title').textContent = feature;
  trendSection.style.display = 'block';
  // TODO: Render trend chart for selected feature
}

function renderArticlesTable() {
  const container = document.getElementById('article-list');
  if (!state.metrics || !state.metrics.articles) {
    container.innerHTML = '<tr><td colspan="4">No articles loaded</td></tr>';
    return;
  }

  let filtered = state.metrics.articles;

  // Filter by year
  filtered = filtered.filter(a => 
    a.year >= state.metricsState.yearStart && a.year <= state.metricsState.yearEnd
  );

  // Filter by search
  if (state.metricsState.search) {
    filtered = filtered.filter(a => 
      (a.citation || '').toLowerCase().includes(state.metricsState.search)
    );
  }

  if (filtered.length === 0) {
    container.innerHTML = '<tr><td colspan="4" style="text-align: center;">No matching articles</td></tr>';
    return;
  }

  const html = filtered.slice(0, 100).map(article => {
    const serviceArea = article.service_area ? article.service_area.replace(/\|/g, ', ') : '—';
    return `
      <tr>
        <td>${article.year}</td>
        <td>${article.citation}</td>
        <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis;">${serviceArea}</td>
        <td>
          <button class="btn-primary" style="padding: 0.5rem 1rem; font-size: 0.875rem;" 
                  onclick="switchToClassifyArticle('${article.article_id}')">
            Code
          </button>
        </td>
      </tr>
    `;
  }).join('');

  container.innerHTML = html;
}

// ============================================================================
// TAB 2: REVIEW SUMMARIES
// ============================================================================

function initializeSummariesTab() {
  const loginSection = document.getElementById('summaries-login');
  const reviewSection = document.getElementById('summaries-review');

  if (state.summariesState.usercode) {
    loginSection.style.display = 'none';
    reviewSection.style.display = 'block';
    populateSummariesArticleSelect();
  } else {
    loginSection.style.display = 'block';
    reviewSection.style.display = 'none';
  }
}

async function startSummaryReview() {
  const usercode = document.getElementById('summaries-usercode').value.trim();
  if (!usercode) {
    alert('Please enter a reviewer code');
    return;
  }
  
  state.summariesState.usercode = usercode;
  localStorage.setItem('summaries_usercode', usercode);
  
  document.getElementById('summaries-login').style.display = 'none';
  document.getElementById('summaries-review').style.display = 'block';
  
  populateSummariesArticleSelect();
}

function populateSummariesArticleSelect() {
  const select = document.getElementById('summaries-article-select');
  select.innerHTML = '<option value="">Choose an article...</option>';

  if (!state.articles || state.articles.length === 0) {
    select.innerHTML += '<option disabled>No articles available</option>';
    return;
  }

  state.articles.forEach(article => {
    const option = document.createElement('option');
    option.value = article.id;
    option.textContent = article.citation;
    select.appendChild(option);
  });
}

async function loadSummaryArticle() {
  const articleId = document.getElementById('summaries-article-select').value;
  if (!articleId) return;

  const article = state.articles.find(a => a.id === articleId);
  if (!article) return;

  state.summariesState.currentArticle = article;

  document.getElementById('summaries-citation').textContent = article.citation;
  document.getElementById('summaries-source-text').textContent = article.sourceText || 'No source text available';
  document.getElementById('summaries-provided-summary').textContent = article.summary || 'No summary available';

  // Reset form
  document.getElementById('summaries-quality').value = '';
  document.getElementById('summaries-notes').value = '';

  document.getElementById('summaries-article-display').style.display = 'block';
}

function pickRandomSummaryArticle() {
  if (!state.articles || state.articles.length === 0) return;
  const random = state.articles[Math.floor(Math.random() * state.articles.length)];
  document.getElementById('summaries-article-select').value = random.id;
  loadSummaryArticle();
}

async function submitSummaryReview(event) {
  event.preventDefault();

  if (!state.summariesState.currentArticle) {
    alert('Please select an article first');
    return;
  }

  const submission = {
    articleId: state.summariesState.currentArticle.id,
    usercode: state.summariesState.usercode,
    summary: state.summariesState.currentArticle.summary,
    quality: document.getElementById('summaries-quality').value,
    notes: document.getElementById('summaries-notes').value
  };

  try {
    const response = await fetch('/api/summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submission)
    });

    if (response.ok) {
      alert('Summary review submitted successfully!');
      document.getElementById('summaries-notes').value = '';
      document.getElementById('summaries-quality').value = '';
      pickRandomSummaryArticle();
    } else {
      const error = await response.json();
      alert(`Error: ${error.error}`);
    }
  } catch (error) {
    alert(`Error submitting review: ${error.message}`);
  }
}

// ============================================================================
// TAB 3: REVIEW CLASSIFICATIONS
// ============================================================================

function initializeClassifyTab() {
  const loginSection = document.getElementById('classify-login');
  const reviewSection = document.getElementById('classify-review');

  if (state.classifyState.usercode) {
    loginSection.style.display = 'none';
    reviewSection.style.display = 'block';
    populateClassifyArticleSelect();
    loadRubricAndLexicon();
  } else {
    loginSection.style.display = 'block';
    reviewSection.style.display = 'none';
    loadAvailableCoders();
  }
}

async function loadAvailableCoders() {
  try {
    const response = await fetch('/api/usercodes');
    if (response.ok) {
      const coders = await response.json();
      if (coders.length > 0) {
        const container = document.getElementById('known-coders');
        container.innerHTML = '<p style="margin-top: 0;">Known coders:</p>';
        coders.forEach(coder => {
          const btn = document.createElement('button');
          btn.className = 'btn-secondary known-coder-btn';
          btn.textContent = coder;
          btn.onclick = () => {
            document.getElementById('classify-usercode').value = coder;
          };
          container.appendChild(btn);
        });
      }
    }
  } catch (error) {
    console.error('Error loading coders:', error);
  }
}

async function startClassification() {
  const usercode = document.getElementById('classify-usercode').value.trim();
  if (!usercode) {
    alert('Please enter a coder code');
    return;
  }

  state.classifyState.usercode = usercode;
  localStorage.setItem('classify_usercode', usercode);

  document.getElementById('classify-login').style.display = 'none';
  document.getElementById('classify-review').style.display = 'block';

  populateClassifyArticleSelect();
  await loadRubricAndLexicon();
}

async function loadRubricAndLexicon() {
  // Try to load from public folder
  try {
    const rubricRes = await fetch('summary_quality_rubric.md');
    if (rubricRes.ok) {
      const text = await rubricRes.text();
      const match = text.match(/```json rubric\s*([\s\S]*?)```/);
      if (match) {
        state.classifyState.rubricDefinition = JSON.parse(match[1]);
      }
    }

    const lexiconRes = await fetch('lexicon.json');
    if (lexiconRes.ok) {
      state.classifyState.lexicon = await lexiconRes.json();
    }
  } catch (error) {
    console.error('Error loading rubric/lexicon:', error);
  }
}

function populateClassifyArticleSelect() {
  const select = document.getElementById('classify-article-select');
  select.innerHTML = '<option value="">Choose an article...</option>';

  if (!state.articles || state.articles.length === 0) {
    select.innerHTML += '<option disabled>No articles available</option>';
    return;
  }

  state.articles.forEach(article => {
    const option = document.createElement('option');
    option.value = article.id;
    option.textContent = article.citation;
    select.appendChild(option);
  });
}

async function loadClassifyArticle() {
  const articleId = document.getElementById('classify-article-select').value;
  if (!articleId) return;

  const article = state.articles.find(a => a.id === articleId);
  if (!article) return;

  state.classifyState.currentArticle = article;

  document.getElementById('classify-citation').textContent = article.citation;
  document.getElementById('classify-source-text').textContent = article.sourceText || 'No source text';

  renderRubricForm();
  renderMetadataForm();

  document.getElementById('classify-article-display').style.display = 'block';
}

function renderRubricForm() {
  const container = document.getElementById('classify-rubric-form');
  if (!state.classifyState.rubricDefinition) {
    container.innerHTML = '<p>Rubric not loaded</p>';
    return;
  }

  const rubric = state.classifyState.rubricDefinition;
  const html = rubric.dimensions.map(dimension => {
    const scores = Array.from(
      { length: rubric.scoreMaximum - rubric.scoreMinimum + 1 },
      (_, i) => rubric.scoreMinimum + i
    );

    return `
      <div class="rubric-item">
        <h5>${dimension.label}</h5>
        <p style="margin: 0 0 0.75rem 0; color: var(--text-light); font-size: 0.875rem;">${dimension.description}</p>
        <div class="rubric-scores">
          ${scores.map(score => `
            <div class="rubric-score">
              <input type="radio" id="rubric-${dimension.id}-${score}" name="rubric-${dimension.id}" value="${score}">
              <label for="rubric-${dimension.id}-${score}">${score}</label>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = html;
}

function renderMetadataForm() {
  const container = document.getElementById('classify-metadata-form');
  if (!state.classifyState.lexicon || !Array.isArray(state.classifyState.lexicon)) {
    container.innerHTML = '<p>Metadata vocabulary not loaded</p>';
    return;
  }

  const html = state.classifyState.lexicon.map(group => {
    if (!group.items || group.items.length === 0) return '';

    return `
      <div class="metadata-group">
        <h5>${group.label}</h5>
        <div class="metadata-items">
          ${group.items.map(item => `
            <div class="metadata-item">
              <input type="checkbox" id="meta-${group.id}-${item.id}" value="${item.id}" name="meta-${group.id}">
              <label for="meta-${group.id}-${item.id}">${item.label}</label>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }).filter(h => h).join('');

  container.innerHTML = html;
}

function pickRandomClassifyArticle() {
  if (!state.articles || state.articles.length === 0) return;
  const random = state.articles[Math.floor(Math.random() * state.articles.length)];
  document.getElementById('classify-article-select').value = random.id;
  loadClassifyArticle();
}

async function submitClassification(event) {
  event.preventDefault();

  if (!state.classifyState.currentArticle) {
    alert('Please select an article');
    return;
  }

  if (!state.classifyState.rubricDefinition) {
    alert('Rubric not loaded');
    return;
  }

  // Collect rubric scores
  const rubric = {};
  state.classifyState.rubricDefinition.dimensions.forEach(dimension => {
    const selected = document.querySelector(`input[name="rubric-${dimension.id}"]:checked`);
    if (selected) {
      rubric[dimension.id] = parseInt(selected.value);
    }
  });

  // Collect metadata selections
  const lexicon = {};
  if (state.classifyState.lexicon && Array.isArray(state.classifyState.lexicon)) {
    state.classifyState.lexicon.forEach(group => {
      const selected = Array.from(
        document.querySelectorAll(`input[name="meta-${group.id}"]:checked`)
      ).map(cb => cb.value);
      if (selected.length > 0) {
        lexicon[group.id] = selected;
      }
    });
  }

  const submission = {
    articleId: state.classifyState.currentArticle.id,
    usercode: state.classifyState.usercode,
    rubric,
    rubricId: state.classifyState.rubricDefinition.id,
    rubricVersion: state.classifyState.rubricDefinition.version,
    lexicon,
    recordType: 'human_coding'
  };

  try {
    const response = await fetch('/api/coding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submission)
    });

    if (response.ok) {
      alert('Classification submitted successfully!');
      // Reset form and load next article
      pickRandomClassifyArticle();
    } else {
      const error = await response.json();
      alert(`Error: ${error.error}`);
    }
  } catch (error) {
    alert(`Error submitting classification: ${error.message}`);
  }
}

function switchToClassifyArticle(articleId) {
  switchTab('classify');
  setTimeout(() => {
    if (!state.classifyState.usercode) {
      const usercode = localStorage.getItem('classify_usercode');
      if (usercode) {
        state.classifyState.usercode = usercode;
        initializeClassifyTab();
      }
    }
    document.getElementById('classify-article-select').value = articleId;
    loadClassifyArticle();
  }, 100);
}

// ============================================================================
// TAB 4: VIEW CLASSIFICATIONS
// ============================================================================

async function loadAllClassifications() {
  try {
    const response = await fetch('/api/codings');
    if (response.ok) {
      state.codings = await response.json();
      renderClassificationsTable();
      populateUsercodeFiter();
    }
  } catch (error) {
    console.error('Error loading classifications:', error);
  }
}

function populateUsercodeFiter() {
  const select = document.getElementById('view-usercode-filter');
  const usercodes = new Set(state.codings.map(c => c.usercode));
  
  Array.from(select.options).slice(1).forEach(opt => opt.remove());

  usercodes.forEach(usercode => {
    const option = document.createElement('option');
    option.value = usercode;
    option.textContent = usercode;
    select.appendChild(option);
  });
}

function renderClassificationsTable() {
  const container = document.getElementById('classifications-list');
  const articleFilter = document.getElementById('view-article-filter').value.toLowerCase();
  const userFilter = document.getElementById('view-usercode-filter').value;

  let filtered = state.codings;
  if (articleFilter) {
    filtered = filtered.filter(c => 
      (state.articles.find(a => a.id === c.articleId)?.citation || '').toLowerCase().includes(articleFilter)
    );
  }
  if (userFilter) {
    filtered = filtered.filter(c => c.usercode === userFilter);
  }

  if (filtered.length === 0) {
    container.innerHTML = '<tr><td colspan="5" style="text-align: center;">No classifications found</td></tr>';
    return;
  }

  const html = filtered.map((coding, i) => {
    const article = state.articles.find(a => a.id === coding.articleId);
    const submitDate = coding.savedAt ? new Date(coding.savedAt).toLocaleDateString() : '—';
    const rubricKeys = Object.keys(coding.rubric || {});
    const qualityScore = rubricKeys.length > 0 ? 
      (Object.values(coding.rubric).reduce((a, b) => a + b, 0) / rubricKeys.length).toFixed(1) : '—';

    return `
      <tr>
        <td>${coding.articleId}</td>
        <td>${coding.usercode}</td>
        <td>${qualityScore}</td>
        <td>${submitDate}</td>
        <td>
          <button class="btn-secondary" style="padding: 0.5rem 1rem; font-size: 0.875rem;" 
                  onclick="showClassificationDetail(${i})">
            View
          </button>
        </td>
      </tr>
    `;
  }).join('');

  container.innerHTML = html;
}

function showClassificationDetail(index) {
  const coding = state.codings[index];
  const article = state.articles.find(a => a.id === coding.articleId);

  let html = `
    <p><strong>Article:</strong> ${coding.articleId} - ${article?.citation || 'Unknown'}</p>
    <p><strong>Coder:</strong> ${coding.usercode}</p>
    <p><strong>Submitted:</strong> ${new Date(coding.savedAt).toLocaleString()}</p>
  `;

  if (coding.rubric && Object.keys(coding.rubric).length > 0) {
    html += '<h4>Quality Scores</h4><ul>';
    Object.entries(coding.rubric).forEach(([key, value]) => {
      html += `<li><strong>${key}:</strong> ${value}</li>`;
    });
    html += '</ul>';
  }

  if (coding.lexicon && Object.keys(coding.lexicon).length > 0) {
    html += '<h4>Classifications</h4><ul>';
    Object.entries(coding.lexicon).forEach(([key, values]) => {
      const valueStr = Array.isArray(values) ? values.join(', ') : values;
      html += `<li><strong>${key}:</strong> ${valueStr}</li>`;
    });
    html += '</ul>';
  }

  document.getElementById('classification-detail-content').innerHTML = html;
  document.getElementById('classification-detail').style.display = 'block';
}

function closeClassificationDetail() {
  document.getElementById('classification-detail').style.display = 'none';
}

// Filters event listeners
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('view-article-filter')) {
    document.getElementById('view-article-filter').addEventListener('input', renderClassificationsTable);
    document.getElementById('view-usercode-filter').addEventListener('change', renderClassificationsTable);
  }
});
