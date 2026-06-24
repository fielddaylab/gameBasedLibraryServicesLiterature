# Project Structure

This document explains how the project is organized.

## Overview

The GBLS project is designed to be completely self-contained in a Docker image. This means:

- The entire project (research materials, code, data) gets built into a single Docker image
- Deploy anywhere Docker runs - no external dependencies needed
- Everything you need is in `/app/` inside the container
- User submissions persist in a mounted volume at `/app/submissions/`

## Root Level

All project files, including Docker configuration:

```
/
├── 0_human_sources/                    # Research framework, submissions & documentation
│   ├── metadata-schema-and-lexicon.md  # Coding schema definitions
│   ├── explicit_values.md              # Project values & assumptions
│   ├── submitted_article_coding.json   # User article classification submissions
│   ├── submitted_summary_reviews.json  # User summary review submissions
│   └── ...
├── 1_coded_gbls_corpus_articles/       # Human-coded source summaries (224 articles)
├── 1_coded_reference_corpus_articles/  # Reference corpus journal articles (7,201)
├── 2_calculated_metrics/               # Generated analysis & visualizations
├── prompt_library/                     # LLM prompts for synthesis
├── site/                               # Web applications
│   └── gbls_literature_reviewer/       # ⭐ Unified review application
├── tools/                              # Scripts and utilities
├── .dockerignore                       # Docker build optimization
├── Dockerfile                          # ⭐ Container definition (includes entire project)
├── docker-compose.yml                  # ⭐ Run: docker-compose up -d
├── README.md                           # Project overview
├── STRUCTURE.md                        # This file
└── project-config.json                 # Project settings
```

## Tools Directory

All project utilities and data processing:

```
tools/
├── python/                             # 🐍 Data processing scripts
│   ├── calculate_metrics.py            # Generate metrics & dashboard data
│   ├── calculate_metrics_readme.md     # Documentation
│   ├── extract_chapters_only.py        # Extract text from PDFs
│   ├── extract_and_attach_chapters.py  # Extract + upload to Zotero
│   ├── fetch_unfiled.py                # Zotero integration
│   └── attach_chapters_to_zotero.py    # Attach PDFs to Zotero
```

## Site Directory

The web application:

```
site/
└── gbls_literature_reviewer/           # 🎯 Unified literature review application
    ├── public/                         # Static files served by Express server
    │   ├── index.html                  # Main application interface with 4 tabs
    │   ├── app.js                      # Unified application logic
    │   ├── styles.css                  # Responsive styling
    │   ├── data/                       # Article metadata & lexicon
    │   │   ├── articles/               # 224 article JSON files
    │   │   ├── manifest.json           # Article index
    │   │   ├── catalog.json            # Coding catalog
    │   │   ├── lexicon.json            # Metadata vocabulary
    │   │   └── metrics_explorer_data.js    # Generated metrics data
    │   └── summary_quality_rubric.md   # Coding rubric
    ├── package.json                    # Node.js dependencies
    ├── server.mjs                      # ⭐ Express server (runs in Docker)
    ├── README.md                       # Application documentation
    └── .gitignore
```

## Docker & Deployment Files

At project root for easy access:

| File | Purpose |
|------|---------|
| `Dockerfile` | Builds image containing entire project + Node.js server |
| `docker-compose.yml` | Orchestration - run with `docker-compose up -d` |
| `.dockerignore` | Excludes unnecessary files from build |

## Inside the Docker Image

When you run the container, everything is at `/app/`:

```
/app/
├── 0_human_sources/                    # ✓ Included (submissions saved here)
├── 1_coded_gbls_corpus_articles/       # ✓ Included (article source data)
├── 1_coded_reference_corpus_articles/  # ✓ Included (reference corpus)
├── 2_calculated_metrics/               # ✓ Included (metrics data)
├── prompt_library/                     # ✓ Available for scripts
├── site/
│   └── gbls_literature_reviewer/
│       ├── public/                     # ✓ Served by Express
│       └── server.mjs                  # ✓ Running as main process
├── tools/
│   └── python/                         # ✓ Available for scripts
└── /app/submissions/                   # 📦 Mounted volume (persistent user submissions)
```

The Express server runs at `/app/site/` and:
- Serves unified app interface from `./public/`
- Reads article data from `1_coded_gbls_corpus_articles/`
- Reads metrics from `2_calculated_metrics/`
- Saves user submissions to `0_human_sources/` (mapped from `/app/submissions/`)
- Has access to all project materials (research, Python scripts, metrics data)

## Quick Navigation

### For Running the Application

**Start the server:**
```bash
# Docker (recommended)
docker-compose up -d

# Or locally
cd site && npm install && npm start
```

**Stop the server:**
```bash
docker-compose down
```

**View logs:**
```bash
docker-compose logs -f gbls
```

**Access the application:**
- Local: http://localhost:8787
- Production: http://your-server:8787

### For Research & Content

- **Coded summaries**: `1_coded_gbls_corpus_articles/` (224 articles)
- **Reference corpus**: `1_coded_reference_corpus_articles/` (7,201 articles)
- **Metadata schema**: `0_human_sources/metadata-schema-and-lexicon.md`
- **Project values**: `0_human_sources/explicit_values.md`
- **Metrics data**: `2_calculated_metrics/gbls_corpus_metrics/`

### For Development

- **Server code**: `site/server.mjs`
- **Frontend code**: `site/public/app.js` & `index.html`
- **Styling**: `site/public/styles.css`
- **Dependencies**: `site/package.json`
- **Documentation**: `site/README.md`
- **Python scripts**: `tools/`

### For Deployment

- **Docker setup**: `Dockerfile`, `docker-compose.yml` (at project root)
- **Deployment quick start**: See Docker & Deployment Files section below
- **App documentation**: `site/README.md`

## How the Docker Build Works

### Dockerfile Process

1. **Base image**: `node:20-alpine` (minimal Node.js)
2. **Copy entire project**: `COPY . .` copies everything
3. **Install dependencies**: Installs Node packages for `site`
4. **Set working directory**: Changes to `/app/site`
5. **Expose port**: Listens on port 8787
6. **Run server**: Starts `server.mjs`

### Result

A single, self-contained image with:
- ✓ Node.js runtime
- ✓ All project files
- ✓ All research materials
- ✓ Static assets (frontend)
- ✓ Express server
- ✓ Health checks

### Deployment

The image runs anywhere:
```bash
docker run -p 8787:8787 -v gbls-submissions:/app/submissions gbls-backend:latest
```

No configuration needed - everything is self-contained. Submissions are persisted in the mounted volume.

## File Organization Philosophy

1. **Single-image deployment** - The entire project is containerized as one unit
2. **Complete self-sufficiency** - No external dependencies; everything needed is in the image
3. **Unified interface** - One application handles metrics, summaries, classifications, and viewing
4. **Research materials protected** - All human sources stay in root, not modified by deployment
5. **Persistent data** - User submissions stored in mounted volume, survives container restarts

## Building and Deploying

### Build Image

From project root:

```bash
# Using docker-compose
docker-compose build

# Or directly
docker build -t gbls-backend:latest .
```

### Run Container

```bash
# Using docker-compose (recommended)
docker-compose up -d

# Or directly
docker run -d \
  --name gbls \
  -p 8787:8787 \
  -v gbls-submissions:/app/submissions \
  gbls-backend:latest
```

### Update & Redeploy

```bash
# Rebuild image with latest code/data
docker-compose build --no-cache

# Stop old container
docker-compose down

# Start new version
docker-compose up -d
```

## Development Workflow

### Changes to research materials

No rebuild needed for:
- New articles in `1_coded_gbls_corpus_articles/`
- Updates to `0_human_sources/`
- Changes to `prompt_library/`

These stay on your local machine, not in the container.

### Changes to server code

Rebuild needed for changes to:
- `site/server.mjs`
- `site/public/*`
- `site/package.json`

```bash
docker-compose build --no-cache
docker-compose up -d
```

### Update metrics

```bash
# Regenerate metrics data
python3 tools/calculate_metrics.py

# This updates 2_calculated_metrics/ and metrics assets
# Then rebuild image if you want to deploy with new metrics
```

## Production Deployment

The application can be deployed on any platform that supports Docker:

- AWS ECS
- Azure Container Instances
- Google Cloud Run
- Kubernetes
- Traditional servers
- Digital Ocean, Heroku, etc.

Quick example:

```bash
# Build and push to registry
docker build -t myregistry.io/gbls-reviewer:v1.0 .
docker push myregistry.io/gbls-reviewer:v1.0

# Deploy on server with persistent submissions
docker pull myregistry.io/gbls-reviewer:v1.0
docker run -d \
  -p 8787:8787 \
  -v /data/gbls-submissions:/app/submissions \
  myregistry.io/gbls-reviewer:v1.0
```

Key considerations:
- Mount `/app/submissions` volume for persistent user data
- Expose port 8787 (configurable via `PORT` environment variable)
- Set `SUBMISSIONS_DIR` env var if using custom submission path
- All article data and metrics are embedded in the image

## Troubleshooting

### Container won't start

```bash
# Check logs
docker logs gbls

# Check if port is in use
lsof -i :8787

# Remove volume and retry
docker volume rm gbls-submissions
docker-compose up -d
```

### Server errors

```bash
# Check server is running
docker exec gbls ps aux | grep node

# Test API
curl http://localhost:8787/api/health

# Check submissions directory
docker exec gbls ls -la /app/submissions
```

### Submissions not persisting

```bash
# Verify volume is mounted
docker inspect gbls | grep -A 5 Mounts

# Check permissions on host mount point
ls -la /data/gbls-submissions
```

## Summary

- **Everything lives in Docker** - One image, complete project
- **Deploy anywhere** - Single image runs on any server
- **Research stays clean** - Human materials not modified
- **Data persists** - User records in mounted volume
- **No configuration** - Runs with defaults, highly customizable
