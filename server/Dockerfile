# File: server/Dockerfile

FROM node:23-alpine

# set working directory
WORKDIR /app

# install dependencies separately for better caching
COPY package.json package-lock.json ./
RUN npm install --frozen-lockfile --omit=dev

# copy built application
COPY build/ ./build

# ensure required tools are installed
RUN apk add --no-cache curl

# use non-root user for security
USER node

# expose API port
EXPOSE 3000

# start the server
CMD ["node", "/app/build/start.js"]
