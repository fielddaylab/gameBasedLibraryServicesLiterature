# GBLS Docker Setup

This document explains how the application is containerized and how to use Docker for deployment.

## Architecture Overview

The GBLS application has been refactored to separate concerns:

### Backend Service (Docker Container)
- **Location**: Root directory (`Dockerfile`)
- **What it is**: Node.js Express server
- **Serves**:
  - REST API for coding management (`/api/*)
  - Static assets (Lit Coder UI + Metrics Explorer)
- **Persistent Storage**: `/data` volume (JSON-based file storage)
- **Port**: 8787 (configurable via `PORT` env var)
- **No external dependencies**: Self-contained, runs anywhere Docker runs

### Frontend Assets (Static Files)
- **Location**: `frontend/` directory
- **What they are**: Pure HTML, CSS, JavaScript
- **Can be served by**:
  - The backend service (default, simplest)
  - Separate static host (nginx, Apache, S3, Vercel, etc.)
  - Any HTTP server

## Files Added/Modified

### New Files
```
Dockerfile                  # Container definition for backend
docker-compose.yml         # Orchestration for local development
.dockerignore             # Build optimization
DEPLOYMENT.md             # Complete deployment guide
DOCKER_README.md          # This file
frontend/                 # Static assets for separate hosting
frontend/README.md        # Frontend hosting instructions
frontend/nginx.conf       # Example Nginx configuration
scripts/build-docker.sh   # Helper script to build image
tools/web/gbls_lit_coder/server.mjs  # Express server (replaces Wrangler)
```

### Modified Files
```
tools/web/gbls_lit_coder/package.json  # Added Express dependency + dev script
tools/web/gbls_lit_coder/server.mjs    # New Express server
README.md                          # Added Quick Start section
```

## Quick Start

### Prerequisite
- Docker & Docker Compose installed
- Or Node.js 20+ (for local development)

### Option 1: Docker Compose (Recommended)

```bash
# From project root
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f gbls-backend

# Stop everything
docker-compose down
```

Services:
- **API & UI**: http://localhost:8787
- **Static only** (optional): http://localhost:8765

### Option 2: Direct Docker Commands

```bash
# Build image
docker build -t gbls-backend:latest .

# Run container
docker run -d \
  --name gbls-backend \
  -p 8787:8787 \
  -v gbls-data:/data \
  gbls-backend:latest

# Check health
docker exec gbls-backend curl http://localhost:8787/health

# View logs
docker logs -f gbls-backend

# Stop container
docker stop gbls-backend
docker rm gbls-backend
```

### Option 3: Local Development (No Docker)

```bash
cd tools/gbls_lit_coder

# Install dependencies
npm install

# Run Express server
npm run dev:server

# Server runs on http://localhost:8787
```

## How It Works

### Backend Server (server.mjs)

The Express server is a Node.js replacement for the Cloudflare Worker:

1. **API Endpoints** (same as Worker):
   - `GET /api/health` - Health check
   - `GET /api/usercodes` - List all coders
   - `GET /api/codings?articleId=XXXXX` - Get codings for article
   - `POST /api/codings` - Save a coding

2. **Storage**:
   - **Worker version**: Cloudflare KV (proprietary)
   - **Server version**: JSON files in `/data` directory
   - Format: `coding:{articleId}:{usercode}.json`

3. **Static Files**:
   - Serves everything from `tools/gbls_lit_coder/public/`
   - Includes Lit Coder UI + Metrics Explorer

4. **CORS**:
   - Enables cross-origin requests for separate frontend hosting
   - `Access-Control-Allow-Origin: *` by default
   - Restrict in production as needed

### Container Setup

The Dockerfile:
1. Starts with `node:20-alpine` (minimal base image)
2. Installs npm dependencies
3. Copies static files and server code
4. Creates `/data` directory for persistent storage
5. Exposes port 8787
6. Runs health checks every 30 seconds

### Storage Persistence

**Docker volume** (`gbls-data`):
- Persists across container restarts
- Survives `docker-compose down` (unless using `-v` flag)
- Should be regularly backed up

**Backup example**:
```bash
docker run --rm \
  -v gbls-data:/data \
  -v /backup/location:/backup \
  alpine \
  tar czf /backup/codings-$(date +%Y%m%d-%H%M%S).tar.gz /data
```

## Frontend Hosting Options

### Option A: Served by Backend (Default)
- Backend serves everything
- Simplest setup
- No CORS complexity
- Single container to manage

```bash
# Access at http://localhost:8787
docker-compose up -d
```

### Option B: Separate Static Host

For scaling or CDN usage:

1. **Extract frontend**:
   ```bash
   # Already in ./frontend/ directory
   # Or rebuild:
   cd tools/gbls_lit_coder
   npm run build:corpus
   cp -r public/* ../../frontend/
   ```

2. **Host separately**:
   ```bash
   # Nginx
   docker run -d -p 8765:80 \
     -v $(pwd)/frontend:/usr/share/nginx/html:ro \
     -v $(pwd)/frontend/nginx.conf:/etc/nginx/nginx.conf:ro \
     nginx:alpine

   # Or any static host (S3, Vercel, Netlify, etc.)
   ```

3. **Configure API URL**:
   Frontend needs to know where backend is:
   ```html
   <!-- In index.html or via environment -->
   <script>
     window.API_BASE_URL = 'http://localhost:8787/api/';
   </script>
   ```

### Option C: Production Multi-Container Setup

```yaml
# docker-compose.prod.yml
services:
  backend:
    build: .
    ports:
      - "8787:8787"
    volumes:
      - /data/gbls:/data
    restart: always

  frontend:
    image: nginx:alpine
    ports:
      - "8765:80"
    volumes:
      - ./frontend:/usr/share/nginx/html:ro
      - ./frontend/nginx.conf:/etc/nginx/nginx.conf:ro
    restart: always
    depends_on:
      - backend
```

## Building the Image

### Automatic (Recommended)

```bash
./scripts/build-docker.sh
```

### Manual

```bash
docker build -t gbls-backend:latest .
```

### With Registry (for deployment)

```bash
# Build and tag for registry
docker build -t myregistry.azurecr.io/gbls-backend:v1.0 .

# Push to registry
docker push myregistry.azurecr.io/gbls-backend:v1.0

# Pull and run on server
docker pull myregistry.azurecr.io/gbls-backend:v1.0
docker run -d \
  -p 8787:8787 \
  -v gbls-data:/data \
  myregistry.azurecr.io/gbls-backend:v1.0
```

## Environment Variables

| Variable | Default | Example | Purpose |
|----------|---------|---------|---------|
| `PORT` | 8787 | 3000 | Server port |
| `DATA_DIR` | /data | /var/lib/gbls | Storage location |
| `NODE_ENV` | production | development | Node environment |

## Health Checks

The container includes built-in health monitoring:

```bash
# Check health
docker exec gbls-backend curl http://localhost:8787/health

# Response:
# {"ok":true,"timestamp":"2026-06-23T18:58:48.246Z"}

# Check container health status
docker inspect gbls-backend --format='{{.State.Health.Status}}'

# Output: healthy, unhealthy, or starting
```

## Logging

```bash
# View logs
docker logs gbls-backend

# Follow logs (tail)
docker logs -f gbls-backend

# Last N lines
docker logs --tail 100 gbls-backend

# Since timestamp
docker logs --since 2026-06-23T10:00:00 gbls-backend

# Save to file
docker logs gbls-backend > /var/log/gbls.log 2>&1
```

## Data Management

### Backup

```bash
# Backup using tar
docker run --rm \
  -v gbls-data:/data \
  -v /backup:/backup \
  alpine \
  tar czf /backup/gbls-$(date +%Y%m%d).tar.gz /data

# Backup using native Docker command
docker exec gbls-backend \
  tar czf /dev/stdout /data | gzip > gbls-backup.tar.gz
```

### Restore

```bash
# From tar archive
docker run --rm \
  -v gbls-data:/data \
  -v /backup:/backup \
  alpine \
  tar xzf /backup/gbls-20260623.tar.gz -C /

# Manual restore
docker exec -i gbls-backend \
  tar xzf /dev/stdin -C / < gbls-backup.tar.gz
```

### Export Codings as JSON

```bash
# All codings
docker exec gbls-backend \
  find /data -name 'coding:*.json' -exec cat {} \; > codings.jsonl

# Single article
docker exec gbls-backend \
  find /data -name 'coding:ARTICLEID:*.json' -exec cat {} \; > article-codings.jsonl
```

## Troubleshooting

### Container won't start

```bash
# Check logs
docker logs gbls-backend

# Common issues:
# - Port already in use: lsof -i :8787
# - Corrupted data dir: docker volume rm gbls-data
```

### API returns 500 errors

```bash
# Check if rubric file exists
docker exec gbls-backend ls -la /app/public/summary_quality_rubric.md

# Check permissions
docker exec gbls-backend ls -la /data

# Check full logs
docker logs --tail 200 gbls-backend
```

### Data directory issues

```bash
# Check owner/permissions
docker exec gbls-backend stat /data

# Fix permissions if needed
docker exec gbls-backend chown -R node:node /data

# Check disk space
docker exec gbls-backend df -h /data
```

### CORS errors in frontend

1. Verify backend CORS headers:
```bash
curl -i http://localhost:8787/api/health | grep -i access-control
```

2. Check frontend is making requests to correct URL

3. Verify backend is running:
```bash
docker ps | grep gbls-backend
```

## Production Considerations

### Image Size
- Current: ~200MB (node:20-alpine + dependencies)
- Optimize with: Multi-stage build, dependency pruning

### Security
- Run as non-root: ✓ (uses `node` user)
- Disable CORS in production: Modify `server.mjs` line 20
- Use environment secrets for sensitive data
- Mount `/data` on encrypted volume

### Performance
- Use Docker Compose health checks
- Set resource limits: `--memory 512m --cpus 2`
- Use persistent volume for I/O performance
- Consider caching headers

### Monitoring
- Add logging aggregation (ELK, Splunk, etc.)
- Monitor disk usage in `/data`
- Track API response times
- Monitor container restart frequency

## Deployment Examples

### AWS ECS
```bash
# Push to ECR
aws ecr get-login-password | docker login --username AWS --password-stdin <account>.dkr.ecr.<region>.amazonaws.com
docker tag gbls-backend:latest <account>.dkr.ecr.<region>.amazonaws.com/gbls:latest
docker push <account>.dkr.ecr.<region>.amazonaws.com/gbls:latest

# Create ECS task definition using the image
# Mount EBS volume to /data for persistence
```

### Azure Container Instances
```bash
az container create \
  --resource-group mygroup \
  --name gbls-backend \
  --image gbls-backend:latest \
  --ports 8787 \
  --environment-variables PORT=8787 \
  --volume-mount-path /data \
  --azure-file-volume-account-name myaccount \
  --azure-file-volume-share-name gbls-data
```

### Google Cloud Run (requires refactoring for serverless)
```bash
docker tag gbls-backend:latest gcr.io/PROJECT_ID/gbls-backend:latest
docker push gcr.io/PROJECT_ID/gbls-backend:latest
gcloud run deploy gbls-backend \
  --image gcr.io/PROJECT_ID/gbls-backend:latest \
  --port 8787 \
  --memory 512M
```

## Next Steps

1. **For local development**: See [tools/gbls_lit_coder/readme.md](tools/gbls_lit_coder/readme.md)
2. **For production deployment**: See [DEPLOYMENT.md](DEPLOYMENT.md)
3. **For frontend customization**: See [frontend/README.md](frontend/README.md)

## Support

- Check logs: `docker logs -f gbls-backend`
- Test API: `curl http://localhost:8787/api/health`
- Verify data: `docker exec gbls-backend ls /data`
- Review configurations in Dockerfile and docker-compose.yml
