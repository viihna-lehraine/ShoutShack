#!/bin/bash

SECRETS_FILE="secrets.docker.json.gpg"

DECRYPTED_SECRETS=$(sops -d --output-type json "$SECRETS_FILE")

if [ $? -ne 0 ]; then
  echo "Error decrypting secrets file."
  exit 1
fi

echo "Starting Docker Compose with decrypted secrets..."

echo "$DECRYPTED_SECRETS" | jq -r 'to_entries[] | "--env " + .key + "=" + (.value | tostring)' | \
xargs docker-compose up --build
