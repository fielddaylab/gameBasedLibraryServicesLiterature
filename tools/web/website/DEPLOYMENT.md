# GBLS Deployment Guide

This guide covers deploying the Games-Based Library Services application in production.

## Architecture

The application consists of two main components:

### 1. Backend Service (Docker)
- **What it is**: Node.js Express server running the Lit Coder API and optional static file serving
- **Port**: 8787 (configurable)
- **Storage**: File-based persistent volume for coding records
- **Includes**: API endpoints + static assets (lit coder UI + metrics explorer)

### 2. Frontend Assets (Static)
- **What it is**: Pure HTML/CSS/JavaScript files
- **Can be hosted**: Nginx, Apache, S3, Vercel, Netlify, etc.
- **API calls**: Made to backend service via HTTP/HTTPS
- **Optional**: Can be served by the backend instead

## Quick Start with Docker Compose

### Prerequisites
- Docker
- Docker Compose

### Run Everything

```bash
# From project root
docker-compose up -d

# Services available at:
# - Backend API: http://localhost:8787
# - Frontend (optional): http://localhost:8765
```

### Check Status

```bash
docker-compose logs -f gbls-backend
docker-compose ps
```

### Stop Services

```bash
docker-compose down

# Keep persistent data:
docker-compose down -v
```

## Production Docker Deployment

### Building the Image

```bash
docker build -t gbls-backend:latest .
```

### Running the Container

```bash
docker run -d \
  --name gbls-backend \
  -p 8787:8787 \
  -v gbls-data:/data \
  -e PORT=8787 \
  -e NODE_ENV=production \
  --restart unless-stopped \
  gbls-backend:latest
```

### With Custom Data Directory (Host Path)

```bash
mkdir -p /var/lib/gbls/data

docker run -d \
  --name gbls-backend \
  -p 8787:8787 \
  -v /var/lib/gbls/data:/data \
  -e PORT=8787 \
  -e NODE_ENV=production \
  --restart unless-stopped \
  gbls-backend:latest
```

### Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | 8787 | Service port |
| `DATA_DIR` | /data | Directory for persistent storage |
| `NODE_ENV` | production | Node environment |

## Separate Frontend Hosting

### Option 1: Nginx Container

```bash
docker run -d \
  --name gbls-frontend \
  -p 8765:80 \
  -v $(pwd)/frontend:/usr/share/nginx/html:ro \
  -v $(pwd)/frontend/nginx.conf:/etc/nginx/nginx.conf:ro \
  --restart unless-stopped \
  nginx:alpine
```

### Option 2: Static Host (S3, Azure Blob, etc.)

1. Copy contents of `frontend/` directory to your static host
2. Configure CORS to allow requests to backend API
3. Set environment variable or hardcode API URL in frontend

### Option 3: Traditional Web Server

```bash
# Apache
# Copy frontend/* to /var/www/html

# Nginx
# Copy frontend/* to /var/www/gbls
# Use included nginx.conf as base
```

## SSL/TLS Setup

### Using Docker with Traefik

```yaml
version: '3.8'
services:
  gbls-backend:
    build: .
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.gbls.rule=Host(`coding.example.com`)"
      - "traefik.http.routers.gbls.entrypoints=websecure"
      - "traefik.http.routers.gbls.tls.certresolver=letsencrypt"
      - "traefik.http.services.gbls.loadbalancer.server.port=8787"
    volumes:
      - gbls-data:/data

  traefik:
    image: traefik:v2.10
    command:
      - "--api.insecure=true"
      - "--providers.docker=true"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge=true"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web"
      - "--certificatesresolvers.letsencrypt.acme.email=admin@example.com"
      - "--certificatesresolvers.letsencrypt.acme.storage=/acme.json"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./acme.json:/acme.json

volumes:
  gbls-data:
```

### Using Docker with Caddy

```bash
docker run -d \
  --name caddy \
  -p 80:80 \
  -p 443:443 \
  -v /path/to/Caddyfile:/etc/caddy/Caddyfile:ro \
  -v caddy-data:/data \
  -v caddy-config:/config \
  --restart unless-stopped \
  caddy:latest
```

Caddyfile:
```
coding.example.com {
    reverse_proxy gbls-backend:8787
}

frontend.example.com {
    root * /var/www/gbls
    file_server
    handle_errors {
        rewrite * /index.html
        file_server
    }
}
```

## Data Backup

### Backup Coding Records

The backend stores all coding records in `/data` directory:

```bash
# Backup
docker exec gbls-backend tar czf - /data | gzip > gbls-backup-$(date +%Y%m%d).tar.gz

# Restore
docker exec -i gbls-backend tar xzf - < gbls-backup-20260623.tar.gz
```

### Export as JSON

```bash
# Via API
curl http://localhost:8787/api/codings > codings-export-$(date +%Y%m%d).json

# Via container
docker exec gbls-backend find /data -name '*.json' -exec cat {} \; > codings.jsonl
```

## Monitoring & Health Checks

### Health Endpoint

```bash
curl http://localhost:8787/health
# Response: {"ok":true,"timestamp":"2026-06-23T18:58:48.246Z"}
```

### Docker Health Check

The Dockerfile includes a HEALTHCHECK that runs every 30 seconds. Monitor with:

```bash
docker inspect --format='{{.State.Health.Status}}' gbls-backend
```

### Logs

```bash
# View logs
docker logs -f gbls-backend

# View last 100 lines
docker logs --tail 100 gbls-backend

# Save logs
docker logs gbls-backend > /var/log/gbls.log 2>&1
```

## Updates & Upgrades

### Update Backend Service

```bash
# Rebuild image from source
docker build -t gbls-backend:latest .

# Stop old container
docker stop gbls-backend

# Run new version (data persists)
docker run -d \
  --name gbls-backend-new \
  -p 8787:8787 \
  -v gbls-data:/data \
  --restart unless-stopped \
  gbls-backend:latest

# If successful, remove old image
docker rm gbls-backend
docker rename gbls-backend-new gbls-backend
```

### Update Frontend Assets

```bash
# Rebuild corpus/catalog if needed
cd tools/web/gbls_lit_coder
npm run build:corpus

# Copy to frontend directory
cp -r public/* ../web/gbls_lit_coder/public/

# Restart frontend container (if using separate container)
docker restart gbls-frontend
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker logs gbls-backend

# Common issues:
# - Port 8787 already in use: docker stop <container>
# - /data directory permission: docker exec gbls-backend chown -R node:node /data
```

### API Not Responding

```bash
# Test health endpoint
docker exec gbls-backend curl http://localhost:8787/health

# Check if listening
docker exec gbls-backend netstat -tlnp | grep 8787
```

### Data Directory Issues

```bash
# Check data directory
docker exec gbls-backend ls -la /data

# Verify permissions
docker exec gbls-backend stat /data

# Fix ownership if needed
docker exec gbls-backend chown -R node:node /data
```

### Frontend CORS Errors

If frontend is on different origin:

1. Verify backend CORS headers:
```bash
curl -i http://localhost:8787/api/health
# Should see: Access-Control-Allow-Origin: *
```

2. Verify frontend is making requests to correct API URL

3. Check browser console for CORS errors

## Performance Tuning

### Memory Limits

```bash
docker run -d \
  --memory 512m \
  --memory-swap 512m \
  gbls-backend:latest
```

### CPU Limits

```bash
docker run -d \
  --cpus 2 \
  gbls-backend:latest
```

## Security Considerations

1. **File Permissions**: Data volumes should be readable/writable only by application
2. **CORS**: Restrict `Access-Control-Allow-Origin` in production to known domains
3. **API Authentication**: Consider adding authentication layer (reverse proxy, API key, JWT)
4. **Network**: Use Docker networks to isolate containers
5. **Secrets**: Use Docker secrets for sensitive environment variables

```bash
# Example with restricted CORS
docker exec gbls-backend \
  sed -i "s|Access-Control-Allow-Origin: \*|Access-Control-Allow-Origin: https://example.com|" server.mjs
```

## Support

For issues or questions:
1. Check logs: `docker logs gbls-backend`
2. Test API: `curl http://localhost:8787/api/health`
3. Verify data directory: `docker exec gbls-backend ls -la /data`
4. Check README files in `tools/gbls_lit_coder/` and `frontend/`
