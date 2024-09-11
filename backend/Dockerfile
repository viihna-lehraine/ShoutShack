FROM node:22.3.0

WORKDIR /app

RUN apt-get update && apt-get install -y sops

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

ENV NODE_ENV=development

CMD ["npm", "start"]

LABEL maintainer="Viihna Lehraine"
LABEL version="1.0"
LABEL description="NodeJS web server for Guestbook project"
