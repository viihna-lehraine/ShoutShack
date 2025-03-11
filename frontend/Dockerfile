# File: frontend/Dockerfile

FROM node:23-alpine

WORKDIR /app

# install dependencies separately to cache them
COPY package.json package-lock.json ./
RUN npm install --frozen-lockfile

# copy the rest of the frontend source
COPY . .

# ensure logs directory exists
RUN mkdir -p /var/log/frontend && chown -R node:node /var/log/frontend

# set user to non-root for security
USER node

# expose Vite dev server port
EXPOSE 5173

# start Vite dev server with logging
CMD ["sh", "-c", "npm run dev 2>&1 | tee /var/log/frontend/frontend-$(date '+%Y-%m-%d_%H%M%S').log"]
