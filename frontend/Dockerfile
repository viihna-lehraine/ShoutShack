# Use Node.js v22.3.0 as the base
FROM NODE:22.3.0

# Set the current working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the frontend assets
RUN npm run build

# Use Nginx to serve the frontend assets
FROM nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html

# Docker Metadata
LABEL maintainer="Viihna Lehraine"
LABEL version="1.0"
LABEL description="Client-side files and code for Guestbook project"