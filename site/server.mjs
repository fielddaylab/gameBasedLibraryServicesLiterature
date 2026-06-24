import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8787;

// Data directories - use environment or fallback to project root paths
const SUBMISSIONS_DIR = process.env.SUBMISSIONS_DIR || 
  (process.env.NODE_ENV === 'production' ? '/app/submissions' : path.resolve(__dirname, '../0_human_sources'));
const CORPUS_DIR = process.env.CORPUS_DIR || '../1_coded_gbls_corpus_articles';
const METRICS_DIR = process.env.METRICS_DIR || '../2_calculated_metrics';

// Ensure submissions directory exists
try {
  await fs.mkdir(SUBMISSIONS_DIR, { recursive: true });
} catch (error) {
  if (error.code !== 'EACCES') throw error;
  console.warn(`Cannot create ${SUBMISSIONS_DIR}, using fallback directory`);
}

// Middleware
app.use(express.json());

// CORS headers
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Utility functions
function cleanUsercode(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function safeKeyPart(value) {
  return encodeURIComponent(String(value).toLowerCase());
}

function parseRubric(markdown) {
  const match = markdown.match(/```json rubric\s*([\s\S]*?)```/);
  if (!match) throw new Error('Summary quality rubric definition is missing.');
  const rubric = JSON.parse(match[1]);
  if (!rubric.id || !rubric.version || !Array.isArray(rubric.dimensions) || !rubric.dimensions.length) {
    throw new Error('Summary quality rubric definition is invalid.');
  }
  return rubric;
}

async function loadRubric() {
  const rubricPath = path.join(__dirname, 'public', 'summary_quality_rubric.md');
  const content = await fs.readFile(rubricPath, 'utf-8');
  return parseRubric(content);
}

async function readJSONFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

async function writeJSONFile(filePath, data) {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

async function listFilesWithPrefix(dir, prefix) {
  try {
    const files = await fs.readdir(dir);
    const results = [];
    for (const file of files) {
      if (file.startsWith(prefix) && file.endsWith('.json')) {
        const filePath = path.join(dir, file);
        const data = await readJSONFile(filePath);
        if (data) results.push(data);
      }
    }
    return results;
  } catch (error) {
    return [];
  }
}

function validCoding(body, rubricDefinition) {
  if (!body || typeof body !== 'object') return 'Missing coding data.';
  if (!/^[A-Za-z0-9][A-Za-z0-9 _.-]{0,39}$/.test(cleanUsercode(body.usercode))) {
    return 'Usercode must be 1-40 characters and use letters, numbers, spaces, dots, dashes, or underscores.';
  }
  if (!/^[A-Z0-9]{8}$/.test(String(body.articleId || ''))) {
    return 'Invalid article identifier.';
  }
  const metadataOnly = ['prior_prompt_metadata', 'human_metadata_only'].includes(body.recordType);
  const codingFunction = body.codingFunction || (metadataOnly ? 'metadata' : 'combined');
  if (!['summary', 'metadata', 'combined'].includes(codingFunction)) {
    return 'Coding function must be summary or metadata.';
  }
  const rubricKeys = rubricDefinition.dimensions.map((dimension) => dimension.id);
  const validScores = new Set(
    Array.from(
      { length: rubricDefinition.scoreMaximum - rubricDefinition.scoreMinimum + 1 },
      (_, index) => rubricDefinition.scoreMinimum + index,
    ),
  );
  if (codingFunction !== 'metadata' && !metadataOnly && (
    body.rubricId !== rubricDefinition.id
    || body.rubricVersion !== rubricDefinition.version
  )) {
    return `Rubric version changed. Reload and use ${rubricDefinition.id} v${rubricDefinition.version}.`;
  }
  if (codingFunction !== 'metadata' && !metadataOnly
    && (!body.rubric || rubricKeys.some((key) => !validScores.has(body.rubric[key])))) {
    return 'Every summary rubric dimension must be scored.';
  }
  if (codingFunction !== 'summary' && (!body.lexicon || typeof body.lexicon !== 'object')) {
    return 'Lexicon selections are required.';
  }
  return null;
}

// API Routes

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

// Metrics endpoints
app.get('/api/metrics', async (req, res) => {
  try {
    // Load metrics from 2_calculated_metrics
    const metricsPath = path.resolve(__dirname, METRICS_DIR, 'gbls_corpus_metrics');
    const datasetPath = path.join(metricsPath, 'dataset_summary.json');
    const data = await readJSONFile(datasetPath);
    res.json(data || { error: 'Metrics data not found' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/reference-metrics', async (req, res) => {
  try {
    const metricsPath = path.resolve(__dirname, METRICS_DIR, 'reference_corpus_metrics');
    const datasetPath = path.join(metricsPath, 'dataset_summary.json');
    const data = await readJSONFile(datasetPath);
    res.json(data || { error: 'Reference metrics data not found' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Articles endpoints
app.get('/api/articles', async (req, res) => {
  try {
    const articles = [];
    
    // Try to load from public/data/articles first (preprocessed JSON)
    const publicDataPath = path.join(__dirname, 'public', 'data', 'articles');
    try {
      const files = await fs.readdir(publicDataPath);
      for (const file of files) {
        if (file.endsWith('.json') && !file.startsWith('.')) {
          const filePath = path.join(publicDataPath, file);
          const data = await readJSONFile(filePath);
          if (data && data.id) {
            articles.push({
              id: data.id,
              citation: data.citation || file,
              summary: data.summary || '',
              sourceText: data.sourceText || '',
              evidence: data.evidence || {}
            });
          }
        }
      }
    } catch (error) {
      // Fallback to corpus directory if public/data/articles doesn't exist
      const corpusPath = path.resolve(__dirname, CORPUS_DIR);
      try {
        const files = await fs.readdir(corpusPath);
        for (const file of files) {
          if (file.endsWith('.json') && !file.startsWith('.')) {
            const filePath = path.join(corpusPath, file);
            const data = await readJSONFile(filePath);
            if (data && data.id) {
              articles.push({
                id: data.id,
                citation: data.citation || file,
                summary: data.summary || '',
                sourceText: data.sourceText || '',
                evidence: data.evidence || {}
              });
            }
          }
        }
      } catch (err) {
        // Corpus directory also unavailable
      }
    }
    
    res.json(articles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/article/:id', async (req, res) => {
  try {
    // Try public/data/articles first
    let data = null;
    const publicFilePath = path.join(__dirname, 'public', 'data', 'articles', `${req.params.id}.json`);
    data = await readJSONFile(publicFilePath);
    
    // Fallback to corpus directory
    if (!data) {
      const corpusPath = path.resolve(__dirname, CORPUS_DIR);
      const corpusFilePath = path.join(corpusPath, `${req.params.id}.json`);
      data = await readJSONFile(corpusFilePath);
    }
    
    if (!data) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Coding submissions endpoints
app.get('/api/usercodes', async (req, res) => {
  try {
    const submissions = await listFilesWithPrefix(SUBMISSIONS_DIR, 'user:');
    const usercodes = submissions.map((record) => record.usercode).sort();
    res.json(usercodes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/codings', async (req, res) => {
  try {
    const articleId = req.query.articleId;
    const prefix = articleId ? `coding:${articleId}:` : 'coding:';
    const codings = await listFilesWithPrefix(SUBMISSIONS_DIR, prefix);
    res.json(codings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/coding', async (req, res) => {
  try {
    const body = req.body;
    let rubricDefinition;
    try {
      rubricDefinition = await loadRubric();
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }

    const error = validCoding(body, rubricDefinition);
    if (error) return res.status(400).json({ error });

    const usercode = cleanUsercode(body.usercode);
    const codingFunction = body.codingFunction
      || (['prior_prompt_metadata', 'human_metadata_only'].includes(body.recordType) ? 'metadata' : 'combined');
    
    // Save to 0_human_sources/submitted_article_coding.json
    const submissionsFile = path.resolve(__dirname, '../0_human_sources/submitted_article_coding.json');
    let allSubmissions = await readJSONFile(submissionsFile) || [];
    
    const submission = {
      articleId: body.articleId,
      usercode,
      rubric: codingFunction === 'metadata' ? null : body.rubric || null,
      rubricId: codingFunction === 'metadata' ? null : body.rubricId || null,
      rubricVersion: codingFunction === 'metadata' ? null : body.rubricVersion || null,
      lexicon: codingFunction === 'summary' ? null : body.lexicon,
      summarySavedAt: codingFunction === 'metadata' ? null : new Date().toISOString(),
      metadataSavedAt: codingFunction === 'summary' ? null : new Date().toISOString(),
      savedAt: new Date().toISOString(),
      recordType: body.recordType || 'human_coding',
      source: body.source ?? null,
      version: 2,
    };
    
    // Update or add submission
    const existingIndex = allSubmissions.findIndex(
      s => s.articleId === body.articleId && s.usercode === usercode
    );
    
    if (existingIndex >= 0) {
      allSubmissions[existingIndex] = { ...allSubmissions[existingIndex], ...submission };
    } else {
      allSubmissions.push(submission);
    }
    
    await writeJSONFile(submissionsFile, allSubmissions);
    
    // Also save per-user file for compatibility
    const userFile = path.resolve(__dirname, `../0_human_sources/user_${safeKeyPart(usercode)}.json`);
    await writeJSONFile(userFile, {
      usercode,
      lastSeenAt: new Date().toISOString(),
    });

    res.status(201).json(submission);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Summary review endpoints
app.get('/api/summaries', async (req, res) => {
  try {
    const summariesFile = path.resolve(__dirname, '../0_human_sources/submitted_summary_reviews.json');
    const summaries = await readJSONFile(summariesFile) || [];
    res.json(summaries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/summary', async (req, res) => {
  try {
    const body = req.body;
    
    if (!body || typeof body !== 'object') {
      return res.status(400).json({ error: 'Missing summary data.' });
    }
    if (!/^[A-Za-z0-9][A-Za-z0-9 _.-]{0,39}$/.test(cleanUsercode(body.usercode))) {
      return res.status(400).json({ error: 'Invalid usercode.' });
    }
    if (!/^[A-Z0-9]{8}$/.test(String(body.articleId || ''))) {
      return res.status(400).json({ error: 'Invalid article identifier.' });
    }

    const summariesFile = path.resolve(__dirname, '../0_human_sources/submitted_summary_reviews.json');
    let allSummaries = await readJSONFile(summariesFile) || [];
    
    const submission = {
      articleId: body.articleId,
      usercode: cleanUsercode(body.usercode),
      summary: body.summary || '',
      quality: body.quality || null,
      notes: body.notes || '',
      savedAt: new Date().toISOString(),
    };
    
    // Update or add submission
    const existingIndex = allSummaries.findIndex(
      s => s.articleId === body.articleId && s.usercode === submission.usercode
    );
    
    if (existingIndex >= 0) {
      allSummaries[existingIndex] = submission;
    } else {
      allSummaries.push(submission);
    }
    
    await writeJSONFile(summariesFile, allSummaries);

    res.status(201).json(submission);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/*', (req, res) => {
  res.status(404).json({ error: 'Not found.' });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`GBLS Literature Reviewer API server running on http://localhost:${PORT}`);
  console.log(`Submissions directory: ${SUBMISSIONS_DIR}`);
  console.log(`Corpus directory: ${path.resolve(__dirname, CORPUS_DIR)}`);
  console.log(`Metrics directory: ${path.resolve(__dirname, METRICS_DIR)}`);
});
