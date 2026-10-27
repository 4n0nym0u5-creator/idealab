FROM node:22-bookworm-slim

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

ENV PGLITE_PATH=/data/pglite
ENV BACKUP_DIR=/data/backups
EXPOSE 3000
VOLUME ["/data"]

RUN npm run build

COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
ENTRYPOINT ["/docker-entrypoint.sh"]
