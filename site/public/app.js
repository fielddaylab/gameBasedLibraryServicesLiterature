// GBLS Literature Reviewer - Unified Frontend Application
// Combines metrics explorer and lit_coder functionality

// Global State
const state = {
  user: null,
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
    currentArticle: null
  },

  // Classification state
  classifyState: {
    currentArticle: null,
    rubricDefinition: null,
    lexicon: null
  }
};

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
  // Check authentication first
  await checkAndLoadUser();
  
  if (!state.user) {
    // Not authenticated, redirect to login
    window.location.href = '/login.html';
    return;
  }

  setupTabs();
  setupUserMenu();
  await loadInitialData();
  renderMetricsTab();
});

async function checkAndLoadUser() {
  try {
    const response = await fetch('/api/user');
    if (response.ok) {
      state.user = await response.json();
      displayUserInfo();
      return true;
    }
  } catch (error) {
    console.error('Error loading user:', error);
  }
  return false;
}

function displayUserInfo() {
  const userMenu = document.getElementById('user-menu');
  if (userMenu && state.user) {
    userMenu.innerHTML = `
      <div class="user-info">
        <span class="user-name">${state.user.fullName}</span>
        <span class="user-initials">${state.user.initials}</span>
        <button id="logoutBtn" class="logout-btn">Logout</button>
      </div>
    `;
    
    document.getElementById('logoutBtn').addEventListener('click', logout);
  }
}

function setupUserMenu() {
  // Menu setup handled in displayUserInfo
}

async function logout() {
  try {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/login.html';
  } catch (error) {
    console.error('Logout error:', error);
  }
}

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

    // Load rubric and lexicon for classification forms
    await loadRubricAndLexicon();
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
    renderMetricsCharts();
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

// ============================================================================
// SUBMISSION SUCCESS HANDLER
// ============================================================================

function showSubmissionSuccess(statusElementId) {
  const statusElement = document.getElementById(statusElementId);
  const submitButton = document.querySelector(`#${statusElementId.replace('-status', '')} button[type="submit"]`);
  
  if (!statusElement) return;
  
  // Show success message
  statusElement.innerHTML = '<p style="color: var(--success-color); font-weight: 500; margin: 0;">✓ Submitted! Thank you.</p>';
  statusElement.style.display = 'block';
  
  // Update button
  if (submitButton) {
    submitButton.textContent = 'Resubmit';
  }
}

// ============================================================================
// TAB 2: REVIEW SUMMARIES
// ============================================================================

function initializeSummariesTab() {
  const loginSection = document.getElementById('summaries-login');
  const reviewSection = document.getElementById('summaries-review');

  if (state.user) {
    // Show user initials
    document.getElementById('summaries-user-display').textContent = 
      `${state.user.fullName} (${state.user.initials})`;
    loginSection.style.display = 'none';
    reviewSection.style.display = 'block';
    populateSummariesArticleSelect();
  } else {
    loginSection.style.display = 'block';
    reviewSection.style.display = 'none';
  }
}

async function startSummaryReview() {
  if (!state.user) {
    alert('Please log in to submit reviews');
    window.location.href = '/login.html';
    return;
  }
  
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
  state.classifyState.currentArticle = article;

  document.getElementById('summaries-citation').textContent = article.citation;
  document.getElementById('summaries-source-text').textContent = article.sourceText || 'No source text available';
  document.getElementById('summaries-provided-summary').textContent = article.summary || 'No summary available';

  // Reset summary review form
  document.getElementById('summaries-notes').value = '';
  // Hide success message
  const statusElement = document.getElementById('summary-form-status');
  if (statusElement) {
    statusElement.style.display = 'none';
  }
  const submitBtn = document.querySelector('#summary-form button[type="submit"]');
  if (submitBtn) {
    submitBtn.textContent = 'Submit Summary Review';
  }

  // Load classification rubric, overall quality, and metadata forms
  renderRubricForm();
  renderOverallQualityForm();
  renderMetadataForm();
  
  // Reset classification form fields
  document.getElementById('classification-notes').value = '';
  document.querySelector('input[name="classification-issues"][value="no"]').checked = true;
  // Hide success message
  const classificationStatusElement = document.getElementById('classification-form-status');
  if (classificationStatusElement) {
    classificationStatusElement.style.display = 'none';
  }
  const classificationSubmitBtn = document.querySelector('#classification-form button[type="submit"]');
  if (classificationSubmitBtn) {
    classificationSubmitBtn.textContent = 'Submit Classification';
  }

  // Try to load existing review for this article
  try {
    const response = await fetch(`/api/summaries/${articleId}`, {
      credentials: 'same-origin'
    });
    
    if (response.ok) {
      const review = await response.json();
      
      // Populate form with existing data
      if (review.qualityRating) {
        // Uncheck all overall quality options first
        document.querySelectorAll('input[name="overall-quality"]').forEach(input => {
          input.checked = false;
        });
        // Check the one that matches
        const selected = document.querySelector(`input[name="overall-quality"][value="${review.qualityRating}"]`);
        if (selected) selected.checked = true;
      }
      
      if (review.notes) {
        document.getElementById('summaries-notes').value = review.notes;
      }
      
      // Populate rubric scores
      if (review.ratings && review.ratings.rubricScores) {
        Object.entries(review.ratings.rubricScores).forEach(([dimensionId, score]) => {
          const input = document.querySelector(`input[name="rubric-${dimensionId}"][value="${score}"]`);
          if (input) input.checked = true;
        });
      }
      
       // Show that this is a previous submission
       submitBtn.textContent = 'Update Summary Review';
     }
   } catch (error) {
     console.log('[Load Summary] No previous review found or error:', error.message);
   }
   
   // Try to load existing classification for this article
   try {
     const codingResponse = await fetch(`/api/codings/${articleId}`, {
       credentials: 'same-origin'
     });
     
     if (codingResponse.ok) {
       const coding = await codingResponse.json();
       console.log('[Load Summary] Retrieved coding:', coding);
       
       // Populate form with existing data
       if (coding.notes) {
         console.log('[Load Summary] Setting classification notes:', coding.notes);
         document.getElementById('classification-notes').value = coding.notes;
       }
       
       if (coding.hadIssues !== undefined) {
         const issueOption = coding.hadIssues ? 'yes' : 'no';
         console.log('[Load Summary] Setting classification issues to:', issueOption);
         document.querySelector(`input[name="classification-issues"][value="${issueOption}"]`).checked = true;
       }
       
       // Populate metadata codes (classifications don't have rubric scores)
       if (coding.codes) {
         console.log('[Load Summary] Setting classification codes:', coding.codes);
         Object.entries(coding.codes).forEach(([key, value]) => {
           // All codes in classifications are metadata (arrays)
           if (Array.isArray(value)) {
             value.forEach(itemId => {
               const selector = `input[name="meta-${key}"][value="${itemId}"]`;
               const input = document.querySelector(selector);
               console.log(`[Load Summary] Looking for ${selector}: ${input ? 'FOUND' : 'NOT FOUND'}`);
               if (input) {
                 input.checked = true;
                 console.log(`[Load Summary] Checked: meta-${key}[${itemId}]`);
               }
             });
           }
         });
       }
       
       // Show that this is a previous submission
       if (classificationSubmitBtn) {
         classificationSubmitBtn.textContent = 'Update Classification';
       }
     } else {
       console.log('[Load Summary] No previous classification found (404)');
     }
   } catch (error) {
     console.log('[Load Summary] No previous classification found or error:', error.message);
   }

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

  if (!state.user) {
    alert('You must be logged in to submit');
    return;
  }

  // Collect rubric scores from the Summary Quality Rubric
  const rubricScores = {};
  if (state.classifyState.rubricDefinition) {
    state.classifyState.rubricDefinition.dimensions.forEach(dimension => {
      const selected = document.querySelector(`input[name="rubric-${dimension.id}"]:checked`);
      if (selected) {
        rubricScores[dimension.id] = parseInt(selected.value);
      }
    });
  }

  // Get overall quality rating from radio buttons
  const overallQualitySelected = document.querySelector('input[name="overall-quality"]:checked');
  const overallQuality = overallQualitySelected ? overallQualitySelected.value : '';

  const notes = document.getElementById('summaries-notes').value;

  const ratings = {
    rubricScores: rubricScores,
    overallQuality: overallQuality,
    notes: notes
  };

  const submission = {
    articleId: state.summariesState.currentArticle.id,
    ratings,
    qualityRating: overallQuality,
    notes: notes
  };

  try {
    const response = await fetch('/api/summaries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(submission)
    });

    if (response.ok) {
      showSubmissionSuccess('summary-form-status');
    } else {
      const error = await response.json();
      alert(`Error: ${error.error}`);
    }
  } catch (error) {
    console.error('Summary submission error:', error);
    alert(`Error submitting review: ${error.message}`);
  }
}

// ============================================================================
// TAB 3: REVIEW CLASSIFICATIONS
// ============================================================================

function initializeClassifyTab() {
  const loginSection = document.getElementById('classify-login');
  const reviewSection = document.getElementById('classify-review');

  if (state.user) {
    // Show user initials
    document.getElementById('classify-user-display').textContent = 
      `${state.user.fullName} (${state.user.initials})`;
    loginSection.style.display = 'none';
    reviewSection.style.display = 'block';
    populateClassifyArticleSelect();
    setupClassificationControls();
    loadRubricAndLexicon();
  } else {
    loginSection.style.display = 'block';
    reviewSection.style.display = 'none';
  }
}

async function startClassification() {
  if (!state.user) {
    alert('You must be logged in to submit classifications');
    window.location.href = '/login.html';
    return;
  }

  document.getElementById('classify-login').style.display = 'none';
  document.getElementById('classify-review').style.display = 'block';

  populateClassifyArticleSelect();
  setupClassificationControls();
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
        console.log('[RUBRIC] Loaded rubric:', state.classifyState.rubricDefinition);
      } else {
        console.warn('[RUBRIC] Failed to extract JSON from markdown');
      }
    } else {
      console.warn('[RUBRIC] Failed to fetch rubric file:', rubricRes.status);
    }

    const lexiconRes = await fetch('lexicon.json');
    if (lexiconRes.ok) {
      state.classifyState.lexicon = await lexiconRes.json();
      console.log('[LEXICON] Loaded lexicon with', state.classifyState.lexicon.length, 'groups');
    } else {
      console.warn('[LEXICON] Failed to fetch lexicon file:', lexiconRes.status);
    }
  } catch (error) {
    console.error('[RUBRIC/LEXICON] Error loading:', error);
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

function setupClassificationControls() {
  const articleSelect = document.getElementById('classify-article-select');
  if (articleSelect) {
    articleSelect.addEventListener('change', loadClassifyArticle);
  }
}

async function loadClassifyArticle() {
  const articleId = document.getElementById('classify-article-select').value;
  if (!articleId) return;

  const article = state.articles.find(a => a.id === articleId);
  if (!article) return;

  state.classifyState.currentArticle = article;

  document.getElementById('classify-citation').textContent = article.citation;
  document.getElementById('classify-source-text').textContent = article.sourceText || 'No source text';

  // Reset classification form fields
  document.getElementById('classification-notes').value = '';
  document.querySelector('input[name="classification-issues"][value="no"]').checked = true;
  // Hide success message
  const statusElement = document.getElementById('classification-form-status');
  if (statusElement) {
    statusElement.style.display = 'none';
  }
  const submitBtn = document.querySelector('#classification-form button[type="submit"]');
  if (submitBtn) {
    submitBtn.textContent = 'Submit Classification';
  }

  // Classifications don't have rubric scores, only metadata
  renderMetadataForm();
  
  // Log what form elements exist after rendering
  console.log('[Load Coding] After rendering - checking form elements:');
  const metaInputs = document.querySelectorAll('input[name^="meta-"]');
  console.log('[Load Coding] Metadata inputs found:', metaInputs.length);
  console.log('[Load Coding] Sample metadata names:', Array.from(metaInputs).slice(0,5).map(el => ({ name: el.name, value: el.value })));

  // Try to load existing coding for this article
  try {
    const response = await fetch(`/api/codings/${articleId}`, {
      credentials: 'same-origin'
    });
    
    console.log('[Load Coding] Fetch response status:', response.status);
    
    if (response.ok) {
      const coding = await response.json();
      console.log('[Load Coding] Retrieved coding:', coding);
      
      // Populate form with existing data
      if (coding.notes) {
        console.log('[Load Coding] Setting notes:', coding.notes);
        document.getElementById('classification-notes').value = coding.notes;
      }
      
      if (coding.hadIssues !== undefined) {
        const issueOption = coding.hadIssues ? 'yes' : 'no';
        console.log('[Load Coding] Setting issues to:', issueOption);
        document.querySelector(`input[name="classification-issues"][value="${issueOption}"]`).checked = true;
      }
      
      // Populate metadata codes (classifications don't have rubric scores)
      if (coding.codes) {
        console.log('[Load Coding] Setting codes:', coding.codes);
        console.log('[Load Coding] Code keys:', Object.keys(coding.codes));
        
        Object.entries(coding.codes).forEach(([key, value]) => {
          console.log(`[Load Coding] Processing code group: ${key} with values:`, value);
          // All codes in classifications are metadata (arrays)
          if (Array.isArray(value)) {
            value.forEach(itemId => {
              const selector = `input[name="meta-${key}"][value="${itemId}"]`;
              const input = document.querySelector(selector);
              console.log(`[Load Coding] Selector: "${selector}" => ${input ? 'FOUND' : 'NOT FOUND'}`);
              if (input) {
                input.checked = true;
                console.log(`[Load Coding] Checked: meta-${key}[${itemId}]`);
              }
            });
          }
        });
      }
      
      // Show that this is a previous submission
      submitBtn.textContent = 'Update Classification';
    } else {
      console.log('[Load Coding] No previous coding found (404)');
    }
  } catch (error) {
    console.log('[Load Coding] Error:', error.message);
  }

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
    // Check if levels have the new structure with score, label, definition
    const hasNewStructure = dimension.levels && dimension.levels.length > 0 && typeof dimension.levels[0] === 'object' && 'score' in dimension.levels[0];

    let scoresHtml;
    if (hasNewStructure) {
      // New 5-point structure with labels and tooltips
      scoresHtml = dimension.levels.map(level => `
        <div class="rubric-score" title="${level.definition}">
          <input type="radio" id="rubric-${dimension.id}-${level.score}" name="rubric-${dimension.id}" value="${level.score}">
          <label for="rubric-${dimension.id}-${level.score}">
            <strong>${level.score}</strong> – ${level.label}
          </label>
        </div>
      `).join('');
    } else {
      // Fallback to old structure for backwards compatibility
      const scores = Array.from(
        { length: rubric.scoreMaximum - rubric.scoreMinimum + 1 },
        (_, i) => rubric.scoreMinimum + i
      );
      scoresHtml = scores.map(score => `
        <div class="rubric-score">
          <input type="radio" id="rubric-${dimension.id}-${score}" name="rubric-${dimension.id}" value="${score}">
          <label for="rubric-${dimension.id}-${score}">${score}</label>
        </div>
      `).join('');
    }

    return `
      <div class="rubric-item">
        <h5>${dimension.label}</h5>
        <p style="margin: 0 0 0.75rem 0; color: var(--text-light); font-size: 0.875rem;">${dimension.description}</p>
        <div class="rubric-scores">
          ${scoresHtml}
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = html;
}

function renderOverallQualityForm() {
  const container = document.getElementById('overall-quality-form');
  if (!container) return;

  // Overall Quality scale options
  const overallQualityLevels = [
    {
      score: 1,
      label: "Unusable",
      definition: "The summary substantially misrepresents the article, contains major inaccuracies or omissions, and should not be used as a basis for understanding the source."
    },
    {
      score: 2,
      label: "Poor",
      definition: "The summary captures some aspects of the article but contains significant errors, distortions, or missing information that limit its reliability."
    },
    {
      score: 3,
      label: "Adequate",
      definition: "The summary provides a generally accurate overview of the article's main points but omits important details, nuance, or context. It can support initial understanding but is not a substitute for the original."
    },
    {
      score: 4,
      label: "Good",
      definition: "The summary accurately captures the article's major arguments, methods, findings, and implications with only minor omissions or simplifications. Most readers could rely on it for a solid understanding of the source."
    },
    {
      score: 5,
      label: "Excellent",
      definition: "The summary is highly accurate, comprehensive, and clear. It preserves the article's essential content, context, and conclusions and serves as an effective stand-in for reading the full article for most purposes."
    }
  ];

  const html = overallQualityLevels.map(level => `
    <div class="rubric-score" title="${level.definition}">
      <input type="radio" id="overall-quality-${level.score}" name="overall-quality" value="${level.score}">
      <label for="overall-quality-${level.score}">
        <strong>${level.score}</strong> – ${level.label}
      </label>
    </div>
  `).join('');

  container.innerHTML = html;
}

function renderMetadataForm() {
  const container = document.getElementById('classify-metadata-form');
  if (!state.classifyState.lexicon || !Array.isArray(state.classifyState.lexicon)) {
    container.innerHTML = '<p>Metadata vocabulary not loaded</p>';
    return;
  }

  const html = state.classifyState.lexicon.map(group => {
    // Skip Coding_Confidence as we're replacing it with a Yes/No prompt
    if (group.id === 'Coding_Confidence' || !group.items || group.items.length === 0) return '';

    return `
      <div class="metadata-group">
        <h5>${group.label}</h5>
        <div class="metadata-items">
          ${group.items.map(item => `
            <div class="metadata-item">
              <input type="checkbox" id="meta-${group.id}-${item.id}" value="${item.id}" name="meta-${group.id}">
              <label for="meta-${group.id}-${item.id}" class="metadata-label" title="${item.description || item.label}">${item.label}</label>
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

  if (!state.user) {
    alert('You must be logged in to submit classifications');
    return;
  }

  // Collect metadata selections (codes) - NO rubric scores in classifications
  const codes = {};
  console.log('[Submit Classification] Starting code collection');
  console.log('[Submit Classification] Lexicon exists:', !!state.classifyState.lexicon);
  console.log('[Submit Classification] Lexicon is array:', Array.isArray(state.classifyState.lexicon));
  console.log('[Submit Classification] Lexicon length:', state.classifyState.lexicon?.length);
  
  if (state.classifyState.lexicon && Array.isArray(state.classifyState.lexicon)) {
    state.classifyState.lexicon.forEach(group => {
      console.log(`[Submit Classification] Processing group: ${group.id}`);
      const selector = `input[name="meta-${group.id}"]:checked`;
      const allInputs = document.querySelectorAll(`input[name="meta-${group.id}"]`);
      const checkedInputs = document.querySelectorAll(selector);
      
      console.log(`[Submit Classification]   Selector: "${selector}"`);
      console.log(`[Submit Classification]   Total inputs for this group: ${allInputs.length}`);
      console.log(`[Submit Classification]   Checked inputs: ${checkedInputs.length}`);
      
      const selected = Array.from(checkedInputs).map(cb => cb.value);
      if (selected.length > 0) {
        codes[group.id] = selected;
        console.log(`[Submit Classification]   Selected values: ${selected.join(', ')}`);
      }
    });
  }
  console.log('[Submit Classification] Final codes object:', codes);

  // Collect classification issues flag
  const issuesSelected = document.querySelector('input[name="classification-issues"]:checked');
  const hadIssues = issuesSelected ? issuesSelected.value === 'yes' : false;

  // Collect classification comments
  const classificationComments = document.getElementById('classification-notes').value;

  const submission = {
    articleId: state.classifyState.currentArticle.id,
    codes: codes,
    userInitials: state.user.initials,
    hadClassificationIssues: hadIssues,
    classificationNotes: classificationComments
  };

  console.log('[Submit Classification] Submitting:', submission);

  try {
    const response = await fetch('/api/codings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(submission)
    });

    console.log('[Submit Classification] Response status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('[Submit Classification] Success:', result);
      showSubmissionSuccess('classification-form-status');
    } else {
      const error = await response.json();
      console.error('[Submit Classification] Error response:', error);
      alert(`Error: ${error.error}`);
    }
  } catch (error) {
    console.error('[Submit Classification] Error:', error);
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
