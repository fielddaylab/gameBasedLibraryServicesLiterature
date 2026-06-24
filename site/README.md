# GBLS Literature Reviewer

A unified web application for exploring, reviewing, and classifying articles from the GBLS (Game-Based Library Services) corpus.

## Overview

GBLS Literature Reviewer consolidates two separate applications:
- **GBLS Lit Explorer** - Browse and explore metrics from the coded corpus
- **Review Summaries** - Evaluate and provide feedback on article summaries
- **Review Classifications** - Code articles with quality ratings and metadata
- **View Classifications** - Review all submitted classifications

## Features

- **Unified Interface** - All functions accessible via tabs
- **Data Integration** - Reads from `1_coded_gbls_corpus_articles/` and `2_calculated_metrics/`
- **Persistent Storage** - Submissions saved to `0_human_sources/`
- **No Data Duplication** - References source data directly, no local copies

## Installation

```bash
npm install
```

## Configuration

The application uses environment variables to configure data directories:

- `PORT` - Server port (default: 8787)
- `SUBMISSIONS_DIR` - Directory for user submissions (default: /app/submissions)
- `CORPUS_DIR` - Path to corpus articles (default: ../../../1_coded_gbls_corpus_articles)
- `METRICS_DIR` - Path to metrics data (default: ../../../2_calculated_metrics)

## Running

```bash
npm start
```

The application will start on `http://localhost:8787`

## Data Sources

### Input
- `1_coded_gbls_corpus_articles/` - Article JSON files
- `2_calculated_metrics/` - Calculated metrics and statistics

### Output
- `0_human_sources/submitted_article_coding.json` - Classification submissions
- `0_human_sources/submitted_summary_reviews.json` - Summary reviews
- `0_human_sources/user_*.json` - Per-user metadata

## API Endpoints

### Health
- `GET /api/health` - Health check
- `GET /health` - Alternative health endpoint

### Metrics
- `GET /api/metrics` - GBLS corpus metrics
- `GET /api/reference-metrics` - Reference corpus metrics

### Articles
- `GET /api/articles` - List all articles
- `GET /api/article/:id` - Get specific article

### Coding Submissions
- `GET /api/codings` - Get all codings
- `GET /api/codings?articleId=ID` - Get codings for specific article
- `POST /api/coding` - Submit article classification
- `GET /api/usercodes` - List known coder codes

### Summary Reviews
- `GET /api/summaries` - Get all summary reviews
- `POST /api/summary` - Submit summary review

## File Structure

```
public/
├── index.html              # Main application UI
├── app.js                  # Frontend logic
├── styles.css              # Styling
├── summary_quality_rubric.md  # Rubric definitions
└── lexicon.json            # Metadata vocabulary (if available)

server.mjs                  # Express server
package.json               # Dependencies
```

## Submission Format

### Article Coding
```json
{
  "articleId": "XXXXXXXX",
  "usercode": "coder-name",
  "rubric": {
    "dimension_id": score
  },
  "rubricId": "gbls_summary_quality",
  "rubricVersion": "1.0.0",
  "lexicon": {
    "group_id": ["item1", "item2"]
  },
  "recordType": "human_coding",
  "savedAt": "2026-06-23T..."
}
```

### Summary Review
```json
{
  "articleId": "XXXXXXXX",
  "usercode": "reviewer-name",
  "summary": "reviewed summary text",
  "quality": "excellent|good|adequate|poor",
  "notes": "reviewer notes",
  "savedAt": "2026-06-23T..."
}
```

## Docker Deployment

Build and run with Docker:

```bash
docker build -t gbls-literature-reviewer .
docker run -p 8787:8787 -e PORT=8787 gbls-literature-reviewer
```

Mount volumes for persistent submissions:

```bash
docker run -p 8787:8787 \
  -v gbls-data:/app/submissions \
  -e PORT=8787 \
  gbls-literature-reviewer
```

## Development

The application uses vanilla JavaScript with no build step required. All code is served directly from the `public/` folder.

To modify styling, edit `public/styles.css`.
To modify functionality, edit `public/app.js`.
To modify server logic, edit `server.mjs`.
