#!/bin/sh

set -e

BACKUP_DIR="/db/backups"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="$BACKUP_DIR/shoutshack_backup_$TIMESTAMP.sql"

mkdir -p $BACKUP_DIR

echo "Starting database backup..."

# run pg_dump with compression and error handling
if pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" | gzip > "$BACKUP_FILE.gz"; then
    echo "Backup saved to $BACKUP_FILE.gz"
else
    echo "Backup failed!" >&2
    exit 1
fi
