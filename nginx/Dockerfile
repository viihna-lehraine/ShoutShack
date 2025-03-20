FROM nginx:latest

# copy root CA certificate into the correct location
COPY tls/rootCA.crt /usr/local/share/ca-certificates/rootCA.crt

# update the system's CA certificates
RUN update-ca-certificates

# copy the nginx.conf and other configs
COPY nginx.conf /etc/nginx/nginx.conf
COPY conf.d /etc/nginx/conf.d

CMD ["nginx", "-g", "daemon off;"]
