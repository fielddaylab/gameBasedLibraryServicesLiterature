# Docker Deployment - GBLS Complete Application

## Overview

The GBLS project is packaged as a **single, self-contained Docker image** that includes:

- ✅ Complete project (all research materials, code, data)
- ✅ Node.js Express server
- ✅ Lit Coder coding interface
- ✅ Metrics Explorer dashboard
- ✅ All dependencies

Deploy to any server with Docker - no configuration needed.

## Quick Start

```bash
# Build and run
docker-compose up -d

# Available at http://localhost:8787
```

That's it. Everything works.

## What's Included in the Image

When you build the Docker image, it contains the entire project at `/app/`:

```
/app/
├── 0_human_sources/                # Research framework
├── 1_coded_gbls_corpus_articles/   # 224 coded summaries
├── 1_coded_reference_corpus_articles/  # 7,201 reference articles
├── 2_calculated_metrics/           # Generated metrics
├── prompt_library/                 # LLM prompts
├── tools/
│   ├── python/                     # Data processing scripts
│   │   ├── calculate_metrics.py
│   │   ├── extract_chapters_only.py
│   │   └── ... (other utilities)
│   └── web/
│       ├── gbls_lit_coder/
│       │   ├── public/             # Static assets (HTML, CSS, JS)
│       │   ├── server.mjs          # Express server (RUNNING)
│       │   └── package.json
│       └── ... (other web apps)
└── /data/                          # Mounted volume (persistent)
```

## Docker Files

Located at project root:

| File | Purpose |
|------|---------|
| `Dockerfile` | Defines the container image |
| `docker-compose.yml` | Orchestration (run this) |
| `.dockerignore` | Excludes unnecessary files from build |

## Running

### Start
```bash
docker-compose up -d
```

### Check Status
```bash
docker-compose ps
docker-compose logs -f gbls
```

### Stop
```bash
docker-compose down
```

### Access
- **Application**: http://localhost:8787
- **Health Check**: http://localhost:8787/api/health
- **Metrics Explorer**: http://localhost:8787/metrics_explorer/

## Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | 8787 | Server port |
| `DATA_DIR` | /data | Storage directory |
| `NODE_ENV` | production | Environment |

Customize with:
```bash
docker run -e PORT=3000 gbls-backend:latest
```

## Data Storage

Coding records persist in a Docker volume `gbls-coding-data`:

```bash
# Backup codings
docker run --rm -v gbls-coding-data:/data \
  alpine tar czf - /data | gzip > backup.tar.gz

# List coding files
docker exec gbls find /data -name '*.json' | wc -l

# Export as JSON
docker exec gbls find /data -name 'coding:*.json' -exec cat {} \;
```

The volume survives:
- Container restarts
- `docker-compose down` (unless using `-v`)
- Deployments

## Building

### From Scratch
```bash
docker-compose build --no-cache
```

### With Tag
```bash
docker build -t gbls:v1.0 .
docker build -t myregistry.io/gbls:latest .
```

## Deploying

### Development (This Machine)
```bash
docker-compose up -d
# http://localhost:8787
```

### Production (Remote Server)
```bash
# 1. Build image
docker build -t gbls-backend:prod .

# 2. Push to registry
docker tag gbls-backend:prod myregistry.io/gbls:prod
docker push myregistry.io/gbls:prod

# 3. On production server
docker pull myregistry.io/gbls:prod
docker run -d \
  --name gbls \
  -p 8787:8787 \
  -v gbls-data:/data \
  -v /var/log/gbls:/var/log \
  --restart unless-stopped \
  myregistry.io/gbls:prod
```

See `tools/website/DEPLOYMENT.md` for detailed guides:
- AWS ECS
- Azure Container Instances
- Google Cloud
- Kubernetes
- Traditional servers

## Troubleshooting

### Container won't start
```bash
docker logs gbls
lsof -i :8787  # Check if port is in use
```

### Server not responding
```bash
curl http://localhost:8787/health
docker exec gbls ps aux | grep node
```

### Data directory issues
```bash
docker exec gbls ls -la /data
docker exec gbls chown -R node:node /data
```

### Clean rebuild
```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

## Performance

### Memory
Default: unlimited. Limit with:
```bash
docker run --memory 512m gbls-backend:latest
```

### CPU
Default: unlimited. Limit with:
```bash
docker run --cpus 2 gbls-backend:latest
```

## Monitoring

### Health endpoint
```bash
curl http://localhost:8787/health
# {"ok":true,"timestamp":"2026-06-23T..."}
```

### Container health
```bash
docker ps  # Check STATUS column
docker inspect gbls --format='{{.State.Health.Status}}'
```

### Logs
```bash
docker logs gbls
docker logs gbls --tail 100
docker logs gbls --since 2026-06-23T10:00:00
```

## Updates

### Update code
```bash
git pull
docker-compose build --no-cache
docker-compose up -d
```

### Update metrics data
```bash
python3 tools/calculate_metrics.py
# Then rebuild if deploying with new metrics
docker-compose build --no-cache
docker-compose up -d
```

## Security

### Run as non-root
✅ Already set (uses `node` user)

### Restrict CORS
Edit `tools/gbls_lit_coder/server.mjs` line 22 to restrict origin:
```javascript
res.set('Access-Control-Allow-Origin', 'https://example.com');
```

Then rebuild:
```bash
docker-compose build --no-cache
```

### Use secrets for sensitive data
```bash
docker run \
  --secret db_password \
  -e DB_PASSWORD_FILE=/run/secrets/db_password \
  image:latest
```

## Complete Project Structure

Everything in the image mirrors the local structure:

```
Dockerfile (root)          → FROM node:20-alpine
COPY . .                   → Copies entire project to /app/
tools/gbls_lit_coder/*     → npm ci
npm install completes
WORKDIR /app/tools/gbls_lit_coder
CMD ["node", "server.mjs"] → Starts server

Inside container at runtime:
/app/                      (entire project)
/app/tools/gbls_lit_coder/server.mjs  (running)
/app/tools/gbls_lit_coder/public/     (served static files)
/data/                     (mounted volume for codings)
```

## Support

- **Quick start**: `docker-compose up -d`
- **Logs**: `docker-compose logs -f gbls`
- **Status**: `docker-compose ps`
- **Detailed docs**: See `STRUCTURE.md`, `tools/website/README.md`
- **Deployment**: See `tools/website/DEPLOYMENT.md`

## Key Differences: Docker vs Local

| Aspect | Docker | Local Dev |
|--------|--------|-----------|
| Start | `docker-compose up -d` | `cd tools/gbls_lit_coder && npm run dev:server` |
| Includes | Entire project | Just server code |
| Data | Persists in volume | Local machine |
| Deployment | Copy image anywhere | Requires manual setup |
| Updates | Rebuild image | Edit files, reload |
| Isolation | Complete | Share machine |

## Next Steps

- **Deploy locally**: `docker-compose up -d`
- **Deploy to production**: See `tools/website/DEPLOYMENT.md`
- **Customize**: Edit Dockerfile or docker-compose.yml
- **Monitor**: Use health endpoint and logs
- **Backup**: Export /data volume regularly
