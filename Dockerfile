# Dockerfile
# The image tag MUST match the @playwright/test version in package.json.
FROM mcr.microsoft.com/playwright:v1.55.0-noble

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ENV CI=true
CMD ["npx", "playwright", "test"]
