# File: server/Dockerfile

FROM node:23-alpine

# set working directory
WORKDIR /app

# set environment variables (forces prod dependencies only)
ENV NODE_ENV=production

# install dependencies separately for better Docker caching
COPY package.json package-lock.json ./
RUN npm install --frozen-lockfile

# copy the rest of the application
COPY . .

# ensure required tools are installed
RUN apk add --no-cache curl

# ensure log directory exists & set permissions
RUN mkdir -p /server/logs && chmod -R 777 /server/logs

# copy entrypoint script & make it executable
COPY ./entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# copy log rotation script & make it executable
COPY logrotate.sh /usr/local/bin/logrotate.sh
RUN chmod +x /usr/local/bin/logrotate.sh

# ensure node owns everything
RUN chown -R node:node /app && chmod -R 755 /app

# use non-root user for security
USER node

# expose API port
EXPOSE 3000

# start log rotation in the background, then run the entrypoint
CMD ["/bin/sh", "-c", "/usr/local/bin/logrotate.sh & /usr/local/bin/entrypoint.sh"]
