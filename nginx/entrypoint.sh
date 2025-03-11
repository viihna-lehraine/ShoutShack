#!/bin/sh

# File: nginx/entrypoint.sh

set -e

echo "Starting Nginx..."

# start log rotation and Nginx
echo "Starting Nginx..."
/usr/local/bin/logrotate.sh & exec nginx -g "daemon off;"
