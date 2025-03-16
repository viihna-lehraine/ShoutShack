# File: server/Dockerfile

FROM node:23-alpine

# set working directory
WORKDIR /app

# install dependencies separately for better caching
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile --prod

# copy entire directory
COPY . ./

# ensure required tools are installed
RUN apk add --no-cache curl

# compile TypeScript
RUN pnpm run build

# use non-root user for security
USER node

# expose API port
EXPOSE 3000

# start the server
CMD ["node", "/app/build/start.js"]
