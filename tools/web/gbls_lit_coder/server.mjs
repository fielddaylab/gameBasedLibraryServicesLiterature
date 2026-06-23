import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8787;
const DATA_DIR = process.env.DATA_DIR || '/app/data';

// Ensure data directory exists
await fs.mkdir(DATA_DIR, { recursive: true });

// Middleware
app.use(express.json());

// CORS headers for frontend on different origin
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

async function readCodingFile(key) {
  try {
    const filePath = path.join(DATA_DIR, `${key}.json`);
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

async function writeCodingFile(key, data) {
  const filePath = path.join(DATA_DIR, `${key}.json`);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

async function listCodingFiles(prefix) {
  try {
    const files = await fs.readdir(DATA_DIR);
    const values = [];
    for (const file of files) {
      if (file.startsWith(prefix) && file.endsWith('.json')) {
        const data = await readCodingFile(file.slice(0, -5));
        if (data) values.push(data);
      }
    }
    return values;
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

app.get('/api/usercodes', async (req, res) => {
  try {
    const users = await listCodingFiles('user:');
    const usercodes = users.map((record) => record.usercode).sort();
    res.json(usercodes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/codings', async (req, res) => {
  try {
    const articleId = req.query.articleId;
    const prefix = articleId ? `coding:${articleId}:` : 'coding:';
    const codings = await listCodingFiles(prefix);
    res.json(codings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/codings', async (req, res) => {
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
    const codingKey = `coding:${body.articleId}:${safeKeyPart(usercode)}`;
    const existing = await readCodingFile(codingKey) || {};
    const savedAt = new Date().toISOString();
    const saved = {
      ...existing,
      articleId: body.articleId,
      usercode,
      rubric: codingFunction === 'metadata' ? existing.rubric || null : body.rubric || null,
      rubricId: codingFunction === 'metadata' ? existing.rubricId || null : body.rubricId || null,
      rubricVersion: codingFunction === 'metadata' ? existing.rubricVersion || null : body.rubricVersion || null,
      lexicon: codingFunction === 'summary' ? existing.lexicon || null : body.lexicon,
      summarySavedAt: codingFunction === 'metadata' ? existing.summarySavedAt || null : savedAt,
      metadataSavedAt: codingFunction === 'summary' ? existing.metadataSavedAt || null : savedAt,
      savedAt,
      recordType: body.recordType || 'human_coding',
      source: body.source ?? existing.source ?? null,
      version: 2,
    };

    await writeCodingFile(codingKey, saved);
    await writeCodingFile(`user:${safeKeyPart(usercode)}`, {
      usercode,
      lastSeenAt: savedAt,
    });

    res.status(201).json(saved);
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
  console.log(`GBLS Lit Coder API server running on http://localhost:${PORT}`);
  console.log(`Data directory: ${DATA_DIR}`);
});
