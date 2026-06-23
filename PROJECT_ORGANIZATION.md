# GBLS Project Organization

## Clean, Logical Structure

```
project-root/
│
├── 0_human_sources/                    # Research framework & values
├── 1_coded_gbls_corpus_articles/       # 224 human-coded summaries
├── 1_coded_reference_corpus_articles/  # 7,201 reference articles
├── 2_calculated_metrics/               # Generated metrics & analysis
├── prompt_library/                     # LLM prompts for synthesis
│
├── tools/                              # All project utilities
│   ├── python/                         # Data processing (Python)
│   │   ├── calculate_metrics.py        # Generate metrics from coding
│   │   ├── extract_chapters_only.py    # Extract text from PDFs
│   │   ├── extract_and_attach_chapters.py
│   │   ├── fetch_unfiled.py            # Zotero integration
│   │   ├── attach_chapters_to_zotero.py
│   │   └── calculate_metrics_readme.md
│   │
│   └── web/                            # Web applications & deployment
│       ├── gbls_lit_coder/             # Main web application
│       │   ├── public/                 # Static files (served)
│       │   ├── server.mjs              # Express API server
│       │   ├── package.json
│       │   ├── worker/                 # Cloudflare Worker (reference)
│       │   └── readme.md
│       │
│       ├── metrics_explorer/           # Legacy metrics dashboard
│       │   ├── index.html
│       │   ├── metrics_explorer.js
│       │   └── readme.md
│       │
│       └── website/                    # Deployment documentation
│           ├── README.md               # Quick start
│           ├── DOCKER_README.md        # Detailed Docker guide
│           └── DEPLOYMENT.md           # Production patterns
│
├── Dockerfile                          # ⭐ Single image for entire project
├── docker-compose.yml                  # ⭐ Run with: docker-compose up -d
├── .dockerignore
│
├── README.md                           # Project overview
├── STRUCTURE.md                        # Detailed project structure
├── DOCKER.md                           # Docker quick reference
└── PROJECT_ORGANIZATION.md             # This file
```

## The "Tools" Directory Explained

### `tools/python/`
Contains all **Python data processing utilities**:
- `calculate_metrics.py` - Main metrics generation
- `extract_*.py` - Extract text from research sources
- `fetch_unfiled.py`, `attach_chapters_to_zotero.py` - Zotero integration

**Use when**: Processing raw research data, generating metrics

### `tools/web/`
Contains all **web applications and deployment**:
- `gbls_lit_coder/` - Main coding interface (Express server)
- `metrics_explorer/` - Dashboard visualization
- `website/` - Deployment documentation

**Use when**: Running the web application, deploying, accessing API

## Docker: Everything Together

When you run Docker:
```bash
docker-compose up -d
```

The entire project is copied into the image:
```
Inside container:
/app/                                 # Complete project
├── 0_human_sources/                  # ✓ All included
├── 1_coded_gbls_corpus_articles/     # ✓ All included  
├── 2_calculated_metrics/             # ✓ All included
├── prompt_library/                   # ✓ All included
└── tools/
    ├── python/                       # ✓ Available for Python scripts
    └── web/
        └── gbls_lit_coder/
            ├── public/               # ✓ Served by Express
            └── server.mjs            # ✓ Running as main process
```

Plus:
- `/data/` - Mounted volume for persistent coding records

## Quick Reference

### Run Application
```bash
# Docker (recommended)
docker-compose up -d

# Local development
cd tools/web/gbls_lit_coder && npm run dev:server
```

### Process Data
```bash
python3 tools/python/calculate_metrics.py
```

### Access Application
- **Main interface**: http://localhost:8787
- **Metrics Explorer**: http://localhost:8787/metrics_explorer/
- **API health**: http://localhost:8787/api/health

### Update Code
```bash
# Rebuild image after code changes
docker-compose build --no-cache
docker-compose up -d
```

### View Documentation
- **Project structure**: `STRUCTURE.md`
- **Docker guide**: `DOCKER.md`
- **Deployment**: `tools/web/website/DEPLOYMENT.md`

## Key Design Decisions

1. **Single Docker image** - Entire project containerized
   - No external dependencies needed
   - Deploy anywhere Docker runs
   - Everything self-contained

2. **Python and web tools organized** - `tools/python/` vs `tools/web/`
   - Clear separation of concerns
   - Easy to find what you need
   - Scales with project growth

3. **Deployment docs in `tools/web/website/`**
   - Close to the code it documents
   - Easy to update with code changes
   - Separate from research materials

4. **Research materials at root** - `0_human_sources/`, `prompt_library/`, etc.
   - Not part of deployable artifacts
   - Clear distinction from tools
   - Easy to add new articles

## No Confusion Between

- **tools/** ≠ website tools only (it's "all utilities")
- **tools/python/** = Python data scripts only
- **tools/web/** = Web apps and deployment only
- **scripts/** = Removed (functionality now in appropriate subdirectories)

This structure is:
✅ Self-documenting  
✅ Scalable  
✅ Docker-ready  
✅ Easy to navigate  
✅ Clear intent  
