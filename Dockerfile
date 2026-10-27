FROM node:22-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

ENV DATABASE_PATH=/data/idealab.db
ENV BACKUP_DIR=/data/backups
EXPOSE 3000
VOLUME ["/data"]

RUN DATABASE_PATH=/tmp/idealab-build.db npm run db:setup \
  && DATABASE_PATH=/tmp/idealab-build.db npm run build \
  && rm -f /tmp/idealab-build.db

COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
ENTRYPOINT ["/docker-entrypoint.sh"]
