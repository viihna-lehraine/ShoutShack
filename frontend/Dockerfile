FROM node:23-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --frozen-lockfile

# copy frontend source code
COPY . .

# build frontend for production
RUN npm run build

# explicitly copy static assets into the final build directory
RUN cp -r ./static/* ./public/

FROM nginx:alpine

# remove default nginx page
RUN rm -rf /usr/share/nginx/html/*

# copy built files into nginx HTML directory
COPY --from=builder /app/public /usr/share/nginx/html

# expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
