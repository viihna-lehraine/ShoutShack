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