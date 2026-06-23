# GBLS Complete Application
# Containerizes the entire literature review project with coding interface and metrics

FROM node:20-alpine

WORKDIR /app

# Copy entire project
COPY . .

# Install dependencies
RUN cd tools/web/gbls_lit_coder && npm ci --only=production

# Create data directory for persistent storage
RUN mkdir -p /data

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8787/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Environment variables
ENV NODE_ENV=production \
    PORT=8787 \
    DATA_DIR=/data

# Expose port
EXPOSE 8787

# Run server from tools/web/gbls_lit_coder
WORKDIR /app/tools/web/gbls_lit_coder
CMD ["node", "server.mjs"]
