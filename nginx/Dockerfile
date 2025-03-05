# File: nginx/Dockerfile

FROM nginx:latest

# Remove default Nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom Nginx config into the container
COPY nginx.conf /etc/nginx/nginx.conf
