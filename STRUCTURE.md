# Project Structure

This document explains how the project is organized.

## Overview

The GBLS project is designed to be completely self-contained in a Docker image. This means:

- The entire project (research materials, code, data) gets built into a single Docker image
- Deploy anywhere Docker runs - no external dependencies needed
- Everything you need is in `/app/` inside the container
- User coding records persist in a mounted volume at `/data/`

## Root Level

All project files, including Docker configuration:

```
/
├── 0_human_sources/                    # Research framework & documentation
│   ├── metadata-schema-and-lexicon.md  # Coding schema definitions
│   ├── explicit_values.md              # Project values & assumptions
│   └── ...
├── 1_coded_gbls_corpus_articles/       # Human-coded source summaries (224 articles)
├── 1_coded_reference_corpus_articles/  # Reference corpus journal articles (7,201)
├── 2_calculated_metrics/               # Generated analysis & visualizations
├── prompt_library/                     # LLM prompts for synthesis
├── tools/                              # Scripts and applications
├── .dockerignore                       # Docker build optimization
├── Dockerfile                          # ⭐ Container definition (includes entire project)
├── docker-compose.yml                  # ⭐ Run: docker-compose up -d
├── README.md                           # Project overview
├── STRUCTURE.md                        # This file
└── project-config.json                 # Project settings
```

## Tools Directory

All project utilities organized by type:

```
tools/
├── python/                             # 🐍 Data processing scripts
│   ├── calculate_metrics.py            # Generate metrics & dashboard data
│   ├── calculate_metrics_readme.md     # Documentation
│   ├── extract_chapters_only.py        # Extract text from PDFs
│   ├── extract_and_attach_chapters.py  # Extract + upload to Zotero
│   ├── fetch_unfiled.py                # Zotero integration
│   └── attach_chapters_to_zotero.py    # Attach PDFs to Zotero
└── web/                                # 🌐 Web applications & deployment
    ├── gbls_lit_coder/                 # 🎯 Main coding application
    │   ├── public/                     # Static files served by Express server
    │   │   ├── index.html              # Lit Coder interface
    │   │   ├── app.js                  # Application logic
    │   │   ├── styles.css              # Styling
    │   │   ├── data/                   # Article metadata
    │   │   ├── metrics_explorer/       # Bundled metrics dashboard
    │   │   └── summary_quality_rubric.md   # Coding rubric
    │   ├── worker/                     # Cloudflare Worker code (reference)
    │   ├── scripts/                    # Build utilities
    │   ├── package.json                # Node.js dependencies
    │   ├── server.mjs                  # ⭐ Express server (runs in Docker)
    │   └── readme.md
    ├── metrics_explorer/               # Legacy metrics dashboard
    │   ├── index.html
    │   ├── metrics_explorer.js
    │   ├── metrics_explorer.css
    │   └── readme.md
    └── website/                        # Deployment documentation
        ├── README.md                   # Docker quick start
        ├── DOCKER_README.md            # Detailed Docker guide
        └── DEPLOYMENT.md               # Production patterns
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
├── 0_human_sources/                    # ✓ Included
├── 1_coded_gbls_corpus_articles/       # ✓ Included
├── 1_coded_reference_corpus_articles/  # ✓ Included
├── 2_calculated_metrics/               # ✓ Included
├── prompt_library/                     # ✓ Included
├── tools/
│   ├── python/                         # ✓ Available for scripts
│   └── web/
│       └── gbls_lit_coder/
│           ├── public/                 # ✓ Served by Express
│           └── server.mjs              # ✓ Running as main process
└── /data/                              # 📦 Mounted volume (persistent coding records)
```

The Express server runs at `/app/tools/web/gbls_lit_coder/` and:
- Serves static files from `./public/`
- Stores coding records in `/data/`
- Has access to all project materials (research, Python scripts, etc.)

## Quick Navigation

### For Running the Application

**Start the server:**
```bash
# Docker (recommended)
docker-compose up -d

# Or locally
cd tools/gbls_lit_coder && npm run dev:server
```

**Stop the server:**
```bash
docker-compose down
```

**View logs:**
```bash
docker-compose logs -f gbls
```

### For Research & Content

- **Coded summaries**: `1_coded_gbls_corpus_articles/` (224 articles)
- **Reference corpus**: `1_coded_reference_corpus_articles/` (7,201 articles)
- **Metadata schema**: `0_human_sources/metadata-schema-and-lexicon.md`
- **Project values**: `0_human_sources/explicit_values.md`
- **Metrics data**: `2_calculated_metrics/gbls_corpus_metrics/`

### For Development

- **Server code**: `tools/web/gbls_lit_coder/server.mjs`
- **Frontend code**: `tools/web/gbls_lit_coder/public/`
- **Dependencies**: `tools/web/gbls_lit_coder/package.json`
- **API definition**: `tools/web/gbls_lit_coder/worker/index.js` (reference)
- **Python scripts**: `tools/python/`

### For Deployment

- **Docker setup**: `Dockerfile`, `docker-compose.yml` (at project root)
- **Deployment guides**: `tools/web/website/DEPLOYMENT.md`
- **Docker docs**: `tools/web/website/DOCKER_README.md`
- **Quick start**: `tools/web/website/README.md`

## How the Docker Build Works

### Dockerfile Process

1. **Base image**: `node:20-alpine` (minimal Node.js)
2. **Copy entire project**: `COPY . .` copies everything
3. **Install dependencies**: Installs Node packages for `tools/gbls_lit_coder`
4. **Set working directory**: Changes to `/app/tools/gbls_lit_coder`
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
docker run -p 8787:8787 -v gbls-data:/data gbls-backend:latest
```

No configuration needed - everything is self-contained.

## File Organization Philosophy

1. **Single-image deployment** - The entire project is containerized as one unit
2. **Complete self-sufficiency** - No external dependencies; everything needed is in the image
3. **Research materials protected** - All human sources stay in root, not modified by deployment
4. **Clean separation** - Deployment docs in `tools/website/`, not scattered everywhere
5. **Persistent data** - User coding records stored in mounted volume, survives container restarts

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
  -v gbls-coding-data:/data \
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
- `tools/web/gbls_lit_coder/server.mjs`
- `tools/web/gbls_lit_coder/public/*`
- `tools/web/gbls_lit_coder/package.json`

```bash
docker-compose build --no-cache
docker-compose up -d
```

### Update metrics

```bash
# Regenerate metrics data
python3 tools/python/calculate_metrics.py

# This updates 2_calculated_metrics/ and metrics assets
# Then rebuild image if you want to deploy with new metrics
```

## Production Deployment

See `tools/web/website/DEPLOYMENT.md` for complete guides:

- AWS ECS
- Azure Container Instances
- Google Cloud Run
- Kubernetes
- Traditional servers
- SSL/TLS
- Monitoring & logging

Quick example:

```bash
# Build and push to registry
docker build -t myregistry.io/gbls:v1.0 .
docker push myregistry.io/gbls:v1.0

# Deploy on server
docker pull myregistry.io/gbls:v1.0
docker run -d \
  -p 8787:8787 \
  -v /data/gbls:/data \
  myregistry.io/gbls:v1.0
```

## Troubleshooting

### Container won't start

```bash
# Check logs
docker logs gbls

# Check if port is in use
lsof -i :8787

# Remove volume and retry
docker volume rm gbls-coding-data
docker-compose up -d
```

### Server errors

```bash
# Check server is running
docker exec gbls ps aux | grep node

# Test API
curl http://localhost:8787/api/health

# Check data directory
docker exec gbls ls -la /data
```

### Access denied errors

```bash
# Fix permissions
docker exec gbls chown -R node:node /data
```

## Summary

- **Everything lives in Docker** - One image, complete project
- **Deploy anywhere** - Single image runs on any server
- **Research stays clean** - Human materials not modified
- **Data persists** - User records in mounted volume
- **No configuration** - Runs with defaults, highly customizable
