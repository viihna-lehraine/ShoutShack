#!/bin/sh

# File: server/entrypoint.sh

set -e

echo "Server starting..."
echo "Current directory: $(pwd)"
ls -lah

# set permissions
chown -R node:node /app/build

# start the server
echo "Running node /app/build/start.js"
exec node /app/build/start.js
