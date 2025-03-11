FROM node:23-alpine

# work in /app as root user for building
WORKDIR /app

# copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm install --frozen-lockfile

# copy the rest of your frontend code
COPY . .

# fix ownership so that "node" user can run the dev server
RUN chown -R node:node /app

# create logs directory & fix permissions
RUN mkdir -p /var/log/frontend && chown -R node:node /var/log/frontend

# switch to Node user
USER node

# expose Vite dev port
EXPOSE 5173

CMD ["sh", "-c", "chown -R node:node /app/node_modules && npm run dev"]
