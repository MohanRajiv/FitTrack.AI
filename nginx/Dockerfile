FROM node:20-alpine AS build

WORKDIR /app

COPY client/package.json client/package-lock.json ./

RUN npm install

COPY client .

RUN npm run build

FROM nginx:1.29-alpine as runner

RUN apk add --no-cache curl
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
