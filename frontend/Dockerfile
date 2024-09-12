FROM node:22.3.0 AS build

WORKDIR /app

# copy package.json and package-lock.json first to leverage Docker caching
COPY package*.json ./

# install dependencies
RUN npm install

# copy the remaining source code
COPY . .

# build the frontend assets
RUN npm run build

# use Nginx as the final image
FROM nginx:alpine

# copy the built assets from the build stage
COPY --from=build /app/public/dist /usr/share/nginx/html

# expose port 8080
EXPOSE 8080

LABEL maintainer="Viihna Lehraine"
LABEL version="1.0"
LABEL description="Client-side files and code for Guestbook project"
