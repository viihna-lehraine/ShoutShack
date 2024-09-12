FROM node:22.3.0

WORKDIR /app

# install system dependencies and SOPS
RUN apt-get update && apt-get install -y curl \
	&& curl -Lo /usr/local/bin/sops https://github.com/mozilla/sops/releases/download/v3.7.1/sops-v3.7.1.linux \
	&& chmod +x /usr/local/bin/sops

# copy package.json and package-lock.json first to leverage Docker caching
COPY package*.json ./

# install node dependencies
RUN npm install

# copy all source files to /app
COPY . .

# expose the application on port 3000
EXPOSE 3000

# set the environment variable
ENV NODE_ENV=development

# start the application
CMD ["npm", "start"]

LABEL maintainer="Viihna Lehraine"
LABEL version="1.0"
LABEL description="NodeJS web server for Guestbook project"
