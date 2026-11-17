FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    PTLOG_DB=/app/data/game.db

COPY package.json ./
COPY server/ ./server/
COPY public/ ./public/

RUN mkdir -p /app/data
VOLUME ["/app/data"]

EXPOSE 3000
CMD ["node", "server/server.js"]
