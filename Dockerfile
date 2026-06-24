# GBLS Literature Reviewer
# Unified application for corpus exploration, summary review, and article classification

FROM node:20-alpine

WORKDIR /app

# Copy entire project
COPY . .

# Install dependencies for unified reviewer
RUN cd site && npm ci --only=production

# Create submissions directory for persistent storage
RUN mkdir -p /app/submissions

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8787/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Environment variables
ENV NODE_ENV=production \
    PORT=8787 \
    SUBMISSIONS_DIR=/app/submissions \
    CORPUS_DIR=../1_coded_gbls_corpus_articles \
    METRICS_DIR=../2_calculated_metrics

# Expose port
EXPOSE 8787

# Run server from site
WORKDIR /app/site
CMD ["node", "server.mjs"]
