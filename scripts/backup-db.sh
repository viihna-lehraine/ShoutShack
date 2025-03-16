#!/bin/bash

set -e

BACKUP_DIR='/home/viihna/Projects/shoutshack/db/backups'
BACKUP_FILE="$BACKUP_DIR/db_backup_$(date +%F_%H-%M-%S).sql"
ENCRYPTED_FILE="${BACKUP_FILE}.enc"

GPG_KEY="$(gpg --list-secret-keys --keyid-format=long | awk '/sec/ {print $2}' | cut -d'/' -f2 | head -n 1)"

if [[ -z "$GPG_KEY" ]]; then
	echo "No GPG key found! Please make sure your key is imported."
	exit 1
fi

mkdir -p "$BACKUP_DIR"

export PGPASSFILE="$HOME/.pgpass"

echo "Dumping database to $BACKUP_FILE..."
if ! /usr/pgsql-17/bin/pg_dump -U viihna -h localhost -d shoutshack -F c -f "$BACKUP_FILE"; then
	echo "Database dump failed!"
	exit 1
fi

echo "Encrypting backup..."
if ! sops --encrypt --pgp "$GPG_KEY" --output "$ENCRYPTED_FILE" "$BACKUP_FILE"; then
	echo "Encryption failed!"
	exit 1
fi

chmod 600 "$ENCRYPTED_FILE"

rm "$BACKUP_FILE"

echo "Backup complete: $ENCRYPTED_FILE"
