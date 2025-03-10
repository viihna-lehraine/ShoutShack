FROM nginx:latest

# remove default Nginx config
RUN rm /etc/nginx/conf.d/default.conf

# copy custom Nginx config into the container
COPY nginx.conf /etc/nginx/nginx.conf

# ensure correct file permissions
RUN mkdir -p /usr/share/nginx/html && \
	chown -R nginx:nginx /usr/share/nginx/html && \
	chmod -R 755 /usr/share/nginx/html

# copy log rotation script
COPY logrotate.sh /usr/local/bin/logrotate.sh
RUN chmod +x /usr/local/bin/logrotate.sh

# run log rotation in background & start Nginx
CMD ["/bin/sh", "-c", "/usr/local/bin/logrotate.sh & nginx -g 'daemon off;'"]
