FROM node:22.3.0

WORKDIR /app

RUN apt-get update && apt-get install -y curl \
	&& curl -Lo /usr/local/bin/sops https://github.com/mozilla/sops/releases/download/v3.7.1/sops-v3.7.1.linux \
	&& chmod +x /usr/local/bin/sops

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run buildOG

EXPOSE 3000

ENV NODE_ENV=development

CMD ["npm", "start"]

LABEL maintainer="Viihna Lehraine"
LABEL version="1.0"
LABEL description="NodeJS web server for Guestbook project"
