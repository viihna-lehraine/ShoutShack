# This file is part of ShoutShack.
#
# ShoutShack is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# ShoutShack is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with ShoutShack. If not, see <https://www.gnu.org/licenses/>.


#!/bin/bash

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
