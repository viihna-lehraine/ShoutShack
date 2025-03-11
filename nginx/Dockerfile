# File: nginx/Dockerfile

FROM nginx:latest

# remove default Nginx config
RUN rm /etc/nginx/conf.d/default.conf

# set correct ownership
RUN chown -R nginx:nginx /usr/share/nginx/html

# copy custom Nginx config into the container
COPY nginx.conf /etc/nginx/nginx.conf

# ensure correct file permissions
RUN mkdir -p /usr/share/nginx/html && \
    chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# copy log rotation script
COPY logrotate.sh /usr/local/bin/logrotate.sh
RUN chmod +x /usr/local/bin/logrotate.sh

# copy entrypoint script
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# set entrypoint script to start Nginx
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

