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

# export environment variables dynamically from the decrypted secrets
# loop through the JSON and export each key-value pair
while IFS="=" read -r key value; do
  export "$key"="$value"
done < <(echo "$DECRYPTED_SECRETS" | jq -r 'to_entries[] | "\(.key)=\(.value)"')

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
docker-compose logs --tail=100
