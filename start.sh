#!/bin/bash

# stop Docker Compose
docker-compose down

# define the secrets file
SECRETS_FILE="secrets.docker.json.gpg"

# decrypt secrets
DECRYPTED_SECRETS=$(sops -d --output-type json "$SECRETS_FILE" 2>/dev/null)

# check for decryption errors
if [ $? -ne 0 ]; then
  echo "Error decrypting secrets file."
  exit 1
fi

echo "Secrets decrypted successfully."

# set environment variables using decrypted secrets
DOCKER_ENV_VARS=$(echo "$DECRYPTED_SECRETS" | jq -r 'to_entries[] | .key + "=" + (.value | tostring)')
export $(echo "$DOCKER_ENV_VARS")

# create Docker network if missing
echo "Ensuring Docker network exists..."
docker network inspect guestbook_app-network >/dev/null 2>&1 || docker network create guestbook_app-network

# start Docker Compose with build
echo "Starting Docker Compose..."
docker-compose up --build -d

# check for errors in Docker Compose
if [ $? -ne 0 ]; then
  echo "Error starting Docker Compose."
  exit 1
fi

echo "Docker Compose started successfully."

# show Docker Compose services
docker-compose ps

# show Docker Compose logs
docker-compose logs backend
docker-compose logs db
docker-compose logs frontend
docker-compose logs nginx
docker-compose logs redis
