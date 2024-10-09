#!/bin/bash


# Load variables from .env
if [ -f ".env" ]; then
    echo ".env file found in the current directory. Loading..."
    set -a
    source ".env"
    set +a
else
    echo ".env file not found in the current directory. Exiting."
    exit 1
fi

# Ensure the script is executed from the correct directory
CWD=$(dirname "$0")
cd "$CWD"

# Print loaded variables
echo "ENCRYPTED_SECRETS_FILE: $ENCRYPTED_SECRETS_FILE"
echo "SECRETS_FILE: $SECRETS_FILE"
echo "GPG_KEY_ID: $GPG_KEY_ID"

# Decrypt the file
sops -d --pgp "$GPG_KEY_ID" "../$ENCRYPTED_SECRETS_FILE" > "../$SECRETS_FILE"

# Check if decryption was successful
if [ $? -eq 0 ]; then
    echo "Decryption successful."
else
    echo "Decryption failed."
fi