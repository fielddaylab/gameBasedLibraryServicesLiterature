# GBLS Project Organization

## Clean, Logical Structure

```
project-root/
│
├── 0_human_sources/                    # Research framework, submissions, values
├── 1_coded_gbls_corpus_articles/       # 224 human-coded summaries
├── 1_coded_reference_corpus_articles/  # 7,201 reference articles
├── 2_calculated_metrics/               # Generated metrics & analysis
├── prompt_library/                     # LLM prompts for synthesis
│
├── site/                               # 🌐 Web application
│   ├── public/                         # Static files (served)
│   │   ├── index.html                  # Main interface (4 tabs)
│   │   ├── app.js                      # Unified application logic
│   │   ├── styles.css
│   │   ├── data/                       # Articles, metrics, lexicon
│   │   └── summary_quality_rubric.md
│   ├── server.mjs                      # Express API server
│   ├── package.json
│   ├── README.md                       # App documentation
│   └── .gitignore
│
├── tools/                              # 🔧 Project utilities & data processing
│   ├── calculate_metrics.py            # Generate metrics from coding
│   ├── extract_chapters_only.py        # Extract text from PDFs
│   ├── extract_and_attach_chapters.py
│   ├── fetch_unfiled.py                # Zotero integration
│   ├── attach_chapters_to_zotero.py
│   └── calculate_metrics_readme.md
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

## Directory Purposes

### `site/`
Contains the **unified web application**:
- `gbls_literature_reviewer/` - Complete literature review interface
  - **Tabs**: GBLS Lit Explorer | Review Summaries | Review Classifications | View Classifications
  - **Features**: Article browsing, metrics visualization, quality ratings, metadata coding, submission management

**Use when**: Running the web application, deploying, accessing API

### `tools/`
Contains all **Python data processing utilities**:
- `calculate_metrics.py` - Main metrics generation
- `extract_*.py` - Extract text from research sources
- `fetch_unfiled.py`, `attach_chapters_to_zotero.py` - Zotero integration
- `calculate_metrics_readme.md` - Metrics generation documentation

**Use when**: Processing raw research data, generating metrics

## Docker: Everything Together

When you run Docker:
```bash
docker-compose up -d
```

The entire project is copied into the image:
```
Inside container:
/app/                                 # Complete project
├── 0_human_sources/                  # ✓ All included (submissions saved here)
├── 1_coded_gbls_corpus_articles/     # ✓ All included  
├── 2_calculated_metrics/             # ✓ All included (metrics & visualizations)
├── prompt_library/                   # ✓ All included
├── site/
│   ├── public/                       # ✓ Served by Express
│   └── server.mjs                    # ✓ Running as main process
└── tools/                            # ✓ Available for Python scripts
    ├── calculate_metrics.py
    ├── extract_*.py
    └── ...
```

Plus:
- `/app/submissions/` - Mounted volume for persistent user submissions

## Quick Reference

### Run Application
```bash
# Docker (recommended)
docker-compose up -d

# Local development
cd site && npm install && npm start
```

### Process Data
```bash
python3 tools/calculate_metrics.py
```

### Access Application
- **Main application**: http://localhost:8787
  - Tab 1: GBLS Lit Explorer (metrics visualization)
  - Tab 2: Review Summaries (summary feedback)
  - Tab 3: Review Classifications (article coding)
  - Tab 4: View Classifications (submission browser)
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
- **Application docs**: `site/README.md`

## Key Design Decisions

1. **Single Docker image** - Entire project containerized
    - No external dependencies needed
    - Deploy anywhere Docker runs
    - Everything self-contained

2. **Organized utilities** - `tools/` for data processing, `site/` for web app
     - Clear separation of concerns
     - Easy to find what you need
     - Scales with project growth

3. **Unified web application** - Single app with multiple tabs
    - Metrics exploration
    - Summary review
    - Article classification
    - Submission viewing
    - All in one interface, no context switching

4. **Research materials at root** - `0_human_sources/`, `prompt_library/`, etc.
    - Not part of deployable artifacts
    - Clear distinction from tools
    - Easy to add new articles
    - Submissions saved alongside research framework

## Structure Clarity

- **site/** = Web application (unified GBLS Literature Reviewer)
- **tools/** = Python data processing scripts
- **0_human_sources/** = Research framework and user submissions
- **1_coded_gbls_corpus_articles/** = Article source data
- **2_calculated_metrics/** = Generated metrics and statistics

This structure is:
✅ Self-documenting  
✅ Scalable  
✅ Docker-ready  
✅ Easy to navigate  
✅ Clear intent
✅ Submission-aware (submissions saved with research materials)  
