FROM node:22.3.0 AS build

WORKDIR /frontend

# copy package.json and package-lock.json first to leverage Docker caching
COPY package*.json ./

# install dependencies
RUN npm install

# copy the remaining source code
COPY . .

# build the frontend assets
RUN npm run build

# ensure the public directory exists
RUN mkdir -p /app/public

# expose port 8080
EXPOSE 8080

LABEL maintainer="Viihna Lehraine"
LABEL version="1.0"
LABEL description="Client-side files and code for Guestbook project"
