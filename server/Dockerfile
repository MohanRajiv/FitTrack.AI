FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install
COPY . .

FROM node:20-alpine AS runner

RUN apk add --no-cache curl
WORKDIR /app
COPY --from=builder /app /app
EXPOSE 3001
ENV NODE_ENV=production
CMD ["node", "server.js"]

