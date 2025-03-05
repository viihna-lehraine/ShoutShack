# File: frontend/Dockerfile

# Use Node.js for frontend build
FROM node:23-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy project files
COPY . .

# Expose Vite dev server port
EXPOSE 5173

# Start Vite
CMD ["npm", "run", "dev"]
