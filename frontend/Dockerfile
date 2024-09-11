FROM node:22.3.0 AS build

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

FROM nginx:alpine

COPY --from=build /app/public/dist /usr/share/nginx/html

LABEL maintainer="Viihna Lehraine"
LABEL version="1.0"
LABEL description="Client-side files and code for Guestbook project"
