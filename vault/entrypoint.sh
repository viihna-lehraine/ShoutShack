#!/bin/sh

set -e

echo "Starting Vault configuration..."

echo "Configuring CA Certificates..."
chown -R vault:vault /vault/tls
chmod 600 /vault/tls/vault.key
chmod 644 /vault/tls/rootCA.crt
chmod 644 /vault/tls/vault.crt
echo "CA Certificates configured."

echo "Installing CA Certificates package and running CA certs update..."
apk add --no-cache ca-certificates
update-ca-certificates
cp /vault/tls/rootCA.crt /etc/ssl/certs/
echo "CA Certificates package installed and Vault certs updated."

echo "Setting environment variables..."
export VAULT_CACERT=/vault/tls/rootCA.crt

echo "Vault is not running and ready for operation."
exit 0
