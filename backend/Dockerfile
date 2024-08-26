FROM NODE:22.3.0

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

ENV NODE_ENV=DEVELOPMENT

CMD ["npm", "start"]

HEALTHCHECK --interval=30s --timeout=10s \
	CMD curl -f https://localhost:3000/health || exit 1

LABEL maintainer="Viihna Lehraine"
LABEL version="1.0"
LABEL description="NodeJS web server for Guestbook project"
