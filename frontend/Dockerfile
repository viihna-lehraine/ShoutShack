# File: frontend/Dockerfile

# use Node.js for frontend build
FROM node:23-alpine

WORKDIR /app

# ensure logs directory exists
RUN mkdir -p /var/log/frontend && chown -R node:node /var/log/frontend

# install dependencies
COPY package.json package-lock.json ./
RUN npm install

# copy project files
COPY . .

# expose Vite dev server port
EXPOSE 5173

# start Vite and log output
CMD ["sh", "-c", "npm run dev 2>&1 | tee /var/log/frontend/frontend-$(date '+%Y-%m-%d_%H%M%S').log"]
