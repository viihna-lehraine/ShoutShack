# File: frontend/Dockerfile

# use a minimal Nginx image to serve static files
FROM nginx:alpine

# remove default Nginx static files
RUN rm -rf /usr/share/nginx/html/*

# copy your pre-built files into Nginx's static file directory
COPY dist/ /usr/share/nginx/html/

# expose container port
EXPOSE 80

# start Nginx
CMD ["nginx", "-g", "daemon off;"]
