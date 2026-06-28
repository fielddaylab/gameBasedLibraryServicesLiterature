import Database from 'better-sqlite3';
import path from 'path';
import { mkdirSync } from 'fs';
import { DB_PATH, isProduction } from './config.mjs';

const dbPath = DB_PATH;

let db;

export function initializeDatabase() {
  // Ensure the directory holding the database exists (e.g. the data root on
  // a fresh persistent disk) before opening the connection. In production we
  // refuse to fall back to ephemeral storage so a misconfigured/unmounted
  // persistent disk fails loudly instead of silently losing user data.
  const dbDir = path.dirname(dbPath);
  try {
    mkdirSync(dbDir, { recursive: true });
  } catch (error) {
    if ((error.code === 'EACCES' || error.code === 'ENOENT') && isProduction) {
      throw new Error(
        `FATAL: database directory "${dbDir}" is not usable (${error.code}). ` +
        `Refusing to use ephemeral storage in production. ` +
        `Verify the persistent disk is mounted and DATA_DIR points at it.`
      );
    }
    throw error;
  }
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  // Create users table if it doesn't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      initials TEXT UNIQUE NOT NULL,
      organizational_affiliation TEXT,
      github_id TEXT UNIQUE,
      google_id TEXT UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME,
      is_active BOOLEAN DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      token TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS article_codings (
      id TEXT PRIMARY KEY,
      article_id TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      codes TEXT NOT NULL,
      rubric_id TEXT,
      rubric_version TEXT,
      had_issues INTEGER DEFAULT 0,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS summary_reviews (
      id TEXT PRIMARY KEY,
      article_id TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      ratings TEXT NOT NULL,
      quality_rating TEXT,
      notes TEXT,
      rubric_id TEXT,
      rubric_version TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // Run migrations
  runMigrations(db);

  return db;
}

function runMigrations(database) {
  // Migration: Add had_issues and notes columns to article_codings if they don't exist
  try {
    const userColumns = database.prepare("PRAGMA table_info(users)").all();
    const userColumnNames = userColumns.map(col => col.name);
    
    if (!userColumnNames.includes('github_username')) {
      console.log('[MIGRATION] Adding github_username column to users');
      database.exec('ALTER TABLE users ADD COLUMN github_username TEXT');
    }

    const codingColumns = database.prepare("PRAGMA table_info(article_codings)").all();
    const codingColumnNames = codingColumns.map(col => col.name);
    
    if (!codingColumnNames.includes('had_issues')) {
      console.log('[MIGRATION] Adding had_issues column to article_codings');
      database.exec('ALTER TABLE article_codings ADD COLUMN had_issues INTEGER DEFAULT 0');
    }
    
    if (!codingColumnNames.includes('notes')) {
      console.log('[MIGRATION] Adding notes column to article_codings');
      database.exec('ALTER TABLE article_codings ADD COLUMN notes TEXT');
    }
  } catch (error) {
    console.error('[MIGRATION] Error running migrations:', error.message);
  }
}

export function getDatabase() {
  if (!db) initializeDatabase();
  return db;
}

// User functions
export function createUser(email, fullName, initials, organizationalAffiliation = null, githubId = null, googleId = null, githubUsername = null) {
  const db = getDatabase();
  try {
    const stmt = db.prepare(`
      INSERT INTO users (email, full_name, initials, organizational_affiliation, github_id, github_username, google_id, last_login)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    const result = stmt.run(email, fullName, initials, organizationalAffiliation, githubId, githubUsername, googleId);
    return getUserById(result.lastInsertRowid);
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      throw new Error('Email or initials already registered');
    }
    throw error;
  }
}

export function getUserByEmail(email) {
  const db = getDatabase();
  return db.prepare('SELECT * FROM users WHERE email = ? AND is_active = 1').get(email);
}

export function getUserById(id) {
  const db = getDatabase();
  return db.prepare('SELECT * FROM users WHERE id = ? AND is_active = 1').get(id);
}

export function getUserByGithubId(githubId) {
  const db = getDatabase();
  return db.prepare('SELECT * FROM users WHERE github_id = ? AND is_active = 1').get(githubId);
}

export function getUserByGoogleId(googleId) {
  const db = getDatabase();
  return db.prepare('SELECT * FROM users WHERE google_id = ? AND is_active = 1').get(googleId);
}

export function updateUserLastLogin(userId) {
  const db = getDatabase();
  db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(userId);
}

export function getUserByInitials(initials) {
  const db = getDatabase();
  return db.prepare('SELECT * FROM users WHERE initials = ? AND is_active = 1').get(initials);
}

export function isInitialsTaken(initials) {
  const db = getDatabase();
  return db.prepare('SELECT COUNT(*) as count FROM users WHERE initials = ?').get(initials).count > 0;
}

// Session functions
export function createSession(userId, token, expiresInHours = 24) {
  const db = getDatabase();
  const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);
  
  db.prepare(`
    INSERT INTO sessions (id, user_id, token, expires_at)
    VALUES (?, ?, ?, ?)
  `).run(sessionId, userId, token, expiresAt.toISOString());
  
  return sessionId;
}

export function getSession(sessionId) {
  const db = getDatabase();
  const session = db.prepare(`
    SELECT s.*, u.* FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.id = ? AND s.expires_at > CURRENT_TIMESTAMP
  `).get(sessionId);
  return session;
}

export function deleteSession(sessionId) {
  const db = getDatabase();
  db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
}

export function cleanupExpiredSessions() {
  const db = getDatabase();
  db.prepare('DELETE FROM sessions WHERE expires_at <= CURRENT_TIMESTAMP').run();
}

// Submission functions - Article Codings
export function createOrUpdateArticleCoding(codingId, articleId, userId, codes, rubricId = null, rubricVersion = null, hadIssues = false, notes = null) {
  const db = getDatabase();
  
  console.log('[createOrUpdateArticleCoding] Called with:', { codingId, articleId, userId, codes, hadIssues, notes });
  
  // Check if user already has a coding for this article
  const existing = db.prepare(`
    SELECT id FROM article_codings WHERE user_id = ? AND article_id = ?
  `).get(userId, articleId);
  
  console.log('[createOrUpdateArticleCoding] Existing record:', existing);
  
  if (existing) {
    // Update existing coding
    console.log('[createOrUpdateArticleCoding] Updating existing record');
    const stmt = db.prepare(`
      UPDATE article_codings 
      SET codes = ?, rubric_id = ?, rubric_version = ?, had_issues = ?, notes = ?
      WHERE user_id = ? AND article_id = ?
    `);
    stmt.run(JSON.stringify(codes), rubricId, rubricVersion, hadIssues ? 1 : 0, notes, userId, articleId);
    return { id: existing.id, article_id: articleId, user_id: userId, updated: true };
  } else {
    // Create new coding
    console.log('[createOrUpdateArticleCoding] Creating new record with values:', { codingId, articleId, userId, codes: JSON.stringify(codes), rubricId, rubricVersion, hadIssues: hadIssues ? 1 : 0, notes });
    const stmt = db.prepare(`
      INSERT INTO article_codings (id, article_id, user_id, codes, rubric_id, rubric_version, had_issues, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(codingId, articleId, userId, JSON.stringify(codes), rubricId, rubricVersion, hadIssues ? 1 : 0, notes);
    console.log('[createOrUpdateArticleCoding] Insert completed');
    return { id: codingId, article_id: articleId, user_id: userId, updated: false };
  }
}

export function createArticleCoding(codingId, articleId, userId, codes, rubricId = null, rubricVersion = null, hadIssues = false, notes = null) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO article_codings (id, article_id, user_id, codes, rubric_id, rubric_version, had_issues, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(codingId, articleId, userId, JSON.stringify(codes), rubricId, rubricVersion, hadIssues ? 1 : 0, notes);
  return { id: codingId, article_id: articleId, user_id: userId };
}

export function getArticleCodings() {
  const db = getDatabase();
  const rows = db.prepare(`
    SELECT ac.*, u.initials
    FROM article_codings ac
    LEFT JOIN users u ON ac.user_id = u.id
    ORDER BY ac.created_at DESC
  `).all();
  return rows.map(row => ({
    id: row.id,
    articleId: row.article_id,
    userId: row.user_id,
    usercode: row.initials,
    codes: JSON.parse(row.codes),
    rubricId: row.rubric_id,
    rubricVersion: row.rubric_version,
    timestamp: row.created_at
  }));
}

export function getArticleCodingsByArticle(articleId) {
  const db = getDatabase();
  const rows = db.prepare(`
    SELECT ac.*, u.initials
    FROM article_codings ac
    LEFT JOIN users u ON ac.user_id = u.id
    WHERE ac.article_id = ?
    ORDER BY ac.created_at DESC
  `).all(articleId);
  return rows.map(row => ({
    id: row.id,
    articleId: row.article_id,
    userId: row.user_id,
    usercode: row.initials,
    codes: JSON.parse(row.codes),
    rubricId: row.rubric_id,
    rubricVersion: row.rubric_version,
    timestamp: row.created_at
  }));
}

// Submission functions - Summary Reviews
export function createOrUpdateSummaryReview(reviewId, articleId, userId, ratings, qualityRating = null, notes = null, rubricId = null, rubricVersion = null) {
  const db = getDatabase();
  
  // Check if user already has a review for this article
  const existing = db.prepare(`
    SELECT id FROM summary_reviews WHERE user_id = ? AND article_id = ?
  `).get(userId, articleId);
  
  if (existing) {
    // Update existing review
    const stmt = db.prepare(`
      UPDATE summary_reviews 
      SET ratings = ?, quality_rating = ?, notes = ?, rubric_id = ?, rubric_version = ?
      WHERE user_id = ? AND article_id = ?
    `);
    stmt.run(JSON.stringify(ratings), qualityRating, notes, rubricId, rubricVersion, userId, articleId);
    return { id: existing.id, article_id: articleId, user_id: userId, updated: true };
  } else {
    // Create new review
    const stmt = db.prepare(`
      INSERT INTO summary_reviews (id, article_id, user_id, ratings, quality_rating, notes, rubric_id, rubric_version)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(reviewId, articleId, userId, JSON.stringify(ratings), qualityRating, notes, rubricId, rubricVersion);
    return { id: reviewId, article_id: articleId, user_id: userId, updated: false };
  }
}

export function createSummaryReview(reviewId, articleId, userId, ratings, qualityRating = null, notes = null, rubricId = null, rubricVersion = null) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO summary_reviews (id, article_id, user_id, ratings, quality_rating, notes, rubric_id, rubric_version)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(reviewId, articleId, userId, JSON.stringify(ratings), qualityRating, notes, rubricId, rubricVersion);
  return { id: reviewId, article_id: articleId, user_id: userId };
}

export function getSummaryReviews() {
  const db = getDatabase();
  const rows = db.prepare(`
    SELECT sr.*, u.initials
    FROM summary_reviews sr
    LEFT JOIN users u ON sr.user_id = u.id
    ORDER BY sr.created_at DESC
  `).all();
  return rows.map(row => ({
    id: row.id,
    articleId: row.article_id,
    userId: row.user_id,
    userInitials: row.initials,
    ratings: JSON.parse(row.ratings),
    qualityRating: row.quality_rating,
    notes: row.notes,
    rubricId: row.rubric_id,
    rubricVersion: row.rubric_version,
    timestamp: row.created_at
  }));
}

export function getSummaryReviewsByArticle(articleId) {
  const db = getDatabase();
  const rows = db.prepare(`
    SELECT sr.*, u.initials
    FROM summary_reviews sr
    LEFT JOIN users u ON sr.user_id = u.id
    WHERE sr.article_id = ?
    ORDER BY sr.created_at DESC
  `).all(articleId);
  return rows.map(row => ({
    id: row.id,
    articleId: row.article_id,
    userId: row.user_id,
    userInitials: row.initials,
    ratings: JSON.parse(row.ratings),
    qualityRating: row.quality_rating,
    notes: row.notes,
    rubricId: row.rubric_id,
    rubricVersion: row.rubric_version,
    timestamp: row.created_at
  }));
}

export function getUserSummaryReview(userId, articleId) {
  const db = getDatabase();
  const row = db.prepare(`
    SELECT sr.*, u.initials
    FROM summary_reviews sr
    LEFT JOIN users u ON sr.user_id = u.id
    WHERE sr.user_id = ? AND sr.article_id = ?
    ORDER BY sr.created_at DESC
    LIMIT 1
  `).get(userId, articleId);
  
  if (!row) return null;
  
  return {
    id: row.id,
    articleId: row.article_id,
    userId: row.user_id,
    userInitials: row.initials,
    ratings: JSON.parse(row.ratings),
    qualityRating: row.quality_rating,
    notes: row.notes,
    rubricId: row.rubric_id,
    rubricVersion: row.rubric_version,
    timestamp: row.created_at
  };
}

export function getUserArticleCoding(userId, articleId) {
  const db = getDatabase();
  const row = db.prepare(`
    SELECT ac.*, u.initials
    FROM article_codings ac
    LEFT JOIN users u ON ac.user_id = u.id
    WHERE ac.user_id = ? AND ac.article_id = ?
    ORDER BY ac.created_at DESC
    LIMIT 1
  `).get(userId, articleId);
  
  if (!row) return null;
  
  return {
    id: row.id,
    articleId: row.article_id,
    userId: row.user_id,
    userInitials: row.initials,
    codes: JSON.parse(row.codes),
    hadIssues: row.had_issues === 1,
    notes: row.notes,
    rubricId: row.rubric_id,
    rubricVersion: row.rubric_version,
    timestamp: row.created_at
  };
}
