# GBLS Website - Docker Deployment

This directory contains deployment documentation for the GBLS application.

> **Note**: The actual Docker configuration files are at the project root:
> - `Dockerfile` - Container definition
> - `docker-compose.yml` - Orchestration
> - `.dockerignore` - Build optimization

## Quick Start

From the project root:

```bash
# Build and run with Docker Compose
docker-compose up -d

# Services available at:
# http://localhost:8787
```

## What's in the Docker Image

The Docker image contains the **entire GBLS project**:

- **Lit Coder** - Literature coding interface
- **Metrics Explorer** - Interactive dashboard
- **Research materials** - All coded articles, schemas, documentation
- **Metrics data** - Pre-calculated analyses
- **Node.js server** - Express API for coding management
- **Static assets** - HTML, CSS, JavaScript

When deployed, the container provides:
- REST API for coding operations
- Static web interface
- Access to all project data
- Persistent storage for user coding records

## Documentation

- **[DOCKER_README.md](DOCKER_README.md)** - Complete Docker setup and architecture
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Production deployment patterns
- **[../../README.md](../../README.md)** - Project overview
- **[../../STRUCTURE.md](../../STRUCTURE.md)** - Project organization

## Building

```bash
# From project root
docker build -t gbls-backend:latest .

# Or use docker-compose
docker-compose build
```

## Running

### Docker Compose (Recommended)
```bash
docker-compose up -d
docker-compose logs -f gbls
docker-compose down
```

### Direct Docker
```bash
docker run -d \
  --name gbls \
  -p 8787:8787 \
  -v gbls-data:/data \
  gbls-backend:latest
```

## Data Storage

Coding records persist in the Docker volume `gbls-coding-data`:

```bash
# Backup
docker exec gbls tar czf /tmp/backup.tar.gz /data
docker cp gbls:/tmp/backup.tar.gz ./gbls-backup-$(date +%Y%m%d).tar.gz

# View stored codings
docker exec gbls find /data -name '*.json' | wc -l
```

## What's Included in the Container

```
/app/
├── 0_human_sources/                 # Research framework
├── 1_coded_gbls_corpus_articles/    # Coded summaries
├── 1_coded_reference_corpus_articles/
├── 2_calculated_metrics/            # Generated data
├── prompt_library/                  # LLM prompts
├── tools/
│   ├── python/                      # Data processing scripts
│   │   ├── calculate_metrics.py
│   │   └── ...
│   └── web/
│       ├── gbls_lit_coder/
│       │   ├── public/              # Static files (served)
│       │   ├── server.mjs           # API server
│       │   └── package.json
│       └── ...
└── /data/                           # Persistent storage (mounted volume)
```

## Project Root Files

All Docker orchestration is at the project root:

- `Dockerfile` - Container definition
- `docker-compose.yml` - Multi-container setup (though we use one service)
- `.dockerignore` - Build optimization

## Local Development vs Docker

### Local Development (No Docker)
```bash
cd tools/gbls_lit_coder
npm install
npm run dev:server
# Runs on http://localhost:8787
```

### Production (Docker)
```bash
docker-compose up -d
# Runs on http://localhost:8787
# All data persisted in volume
# Can run on any server with Docker
```

## Environment Variables

| Variable | Default | Example |
|----------|---------|---------|
| `PORT` | 8787 | 3000 |
| `DATA_DIR` | /data | /var/lib/gbls |
| `NODE_ENV` | production | development |

Set with:
```bash
docker run -e PORT=3000 gbls-backend:latest
```

Or in `docker-compose.yml`:
```yaml
environment:
  PORT: 3000
  DATA_DIR: /data
```

## Deployment

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for:
- AWS ECS
- Azure Container Instances
- Google Cloud Run
- Kubernetes
- Traditional servers
- SSL/TLS setup
- Monitoring

## Troubleshooting

```bash
# Check if running
docker ps | grep gbls

# View logs
docker logs -f gbls

# Test health
curl http://localhost:8787/health

# Access shell
docker exec -it gbls sh

# Check volume
docker volume ls | grep gbls-coding-data
```

## Support

- See `DOCKER_README.md` for detailed Docker documentation
- See `DEPLOYMENT.md` for production patterns
- Check `../STRUCTURE.md` for project organization
