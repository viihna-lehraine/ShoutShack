FROM nginx:alpine

COPY nginx.conf /etc/nginx/nginx.conf

COPY conf.d/guestbook.conf /etc/nginx/conf.d/guestbook.conf

# Docker Metadata
LABEL maintainer="Viihna Lehraine"
LABEL version="1.0"
LABEL description="Nginx reverse proxy for Guestbook project"
