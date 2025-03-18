#!/bin/bash

set -e

BACKUP_DIR='/home/viihna/Projects/shoutshack/db/backups'
BACKUP_FILE="$BACKUP_DIR/db_backup_$(date +%F_%H-%M-%S).sql"
ENCRYPTED_FILE="${BACKUP_FILE}.enc"
MAX_BACKUPS=10

GPG_KEY="$(gpg --list-secret-keys --keyid-format=long | awk '/sec/ {print $2}' | cut -d'/' -f2 | head -n 1)"

if [[ -z "$GPG_KEY" ]]; then
	echo "No GPG key found! Please make sure your key is imported."
	exit 1
fi

mkdir -p "$BACKUP_DIR"

echo "Checking backup directory for cleanup tasks..."

NUM_BACKUPS=$(find "$BACKUP_DIR" -maxdepth 1 -type f -name "*.sql.enc" | wc -l)

if [ "$NUM_BACKUPS" -gt "$MAX_BACKUPS" ]; then
	echo "Moving old backups to archive..."
	find "$BACKUP_DIR" -maxdepth 1 -type f -name "*.sql.enc" | sort | head -n "$((NUM_BACKUPS - MAX_BACKUPS))" | xargs -I {} mv {} "$ARCHIVE_DIR/"
	echo "Old backups archived."
else
	echo "No backups need to be archived."
fi

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
