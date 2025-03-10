# File: server/Dockerfile

# use official Node.js image
FROM node:23-alpine

# set working directory
WORKDIR /app

# copy server entrypoint script and make executable
COPY ./entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# copy package.json and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# copy rest of the application
COPY . .

# install curl
RUN apk add --no-cache curl

# ensure log directory exists
RUN mkdir -p /server/logs && chmod -R 777 /server/logs

# copy log rotation script
COPY logrotate.sh /usr/local/bin/logrotate.sh
RUN chmod +x /usr/local/bin/logrotate.sh

# expose port
EXPOSE 3000

# start log rotation in the background, then run the entrypoint
CMD ["/bin/sh", "-c", "/usr/local/bin/logrotate.sh & /usr/local/bin/entrypoint.sh"]
