# File: nginx/Dockerfile

FROM nginx:latest

# Remove default Nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom Nginx config into the container
COPY nginx.conf /etc/nginx/nginx.conf

# Ensure correct file permissions
RUN mkdir -p /usr/share/nginx/html && \
	chown -R nginx:nginx /usr/share/nginx/html && \
	chmod -R 755 /usr/share/nginx/html

# Turn off Nginx daemon mode
CMD ["nginx", "-g", "daemon off;"]
