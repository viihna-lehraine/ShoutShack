FROM nginx:alpine

# copy Nginx configuration files
COPY nginx.conf /etc/nginx/nginx.conf
COPY conf.d/guestbook.conf /etc/nginx/conf.d/guestbook.conf
COPY ssl/guestbook-nginx-test.crt /etc/nginx/ssl/guestbook-nginx-test.crt
COPY ssl/guestbook-nginx-test.key /etc/nginx/ssl/guestbook-nginx-test.key

CMD ["nginx", "-g", "daemon off;"]

# Docker metadata
LABEL maintainer="Viihna Lehraine"
LABEL version="1.0"
LABEL description="Nginx reverse proxy for Guestbook project"
