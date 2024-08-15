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

# Expose the port your app runs on
EXPOSE 3000

# Set the environment variable to specify the environment as "Developer"
ENV NODE_ENV=DEVELOPMENT

# Start the application
CMD ["npm", "start"]

# Docker Healthcheck
HEALTHCHECK --interval=30s --timeout=10s \
    CMD curl -f https://localhost:3000/health || exit 1

# Docker Metadata
LABEL maintainer="Viihna Lehraine"
LABEL version="1.0"
LABEL description="NodeJS web server for Guestbook project"