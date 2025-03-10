#!/bin/sh

set -e

echo "Current directory: $(pwd)"
ls -lah

export POSTGRES_HOST=$(cat /run/secrets/POSTGRES_HOST)
export POSTGRES_DB=$(cat /run/secrets/POSTGRES_DB)
export POSTGRES_USER=$(cat /run/secrets/POSTGRES_USER)
export POSTGRES_PASSWORD=$(cat /run/secrets/POSTGRES_PASSWORD)

echo "Running node /app/build/index.js"
exec node /app/build/index.js
