#!/bin/sh

set -e

echo "Running database entrypoint script..."

# check for required secrets
if [ -f "/run/secrets/POSTGRES_DB" ]; then
    POSTGRES_DB=$(cat /run/secrets/POSTGRES_DB)
else
    echo "Error: Missing /run/secrets/POSTGRES_DB" >&2
    exit 1
fi

# load secrets
POSTGRES_DB=$(cat /run/secrets/POSTGRES_DB)
POSTGRES_USER=$(cat /run/secrets/POSTGRES_USER)
POSTGRES_PASSWORD=$(cat /run/secrets/POSTGRES_PASSWORD)

echo "POSTGRES_DB: $POSTGRES_DB"
echo "POSTGRES_USER: $POSTGRES_USER"
echo "POSTGRES_PASSWORD: (hidden)"

# ensure the PostgreSQL data directory is initialized
if [ ! -f "/var/lib/postgresql/data/PG_VERSION" ]; then
    echo "Initializing database..."
    su postgres -c "initdb -D /var/lib/postgresql/data"
    chown -R postgres:postgres /var/lib/postgresql/data
    chmod 700 /var/lib/postgresql/data
fi

# ensure the log directory exists
mkdir -p /var/log/postgresql
chown -R postgres:postgres /var/log/postgresql
chmod 755 /var/log/postgresql

# ensure the log filename matches the expected format in postgresql.conf
LOG_FILENAME="postgresql-$(date +%Y-%m-%d_%H%M%S).log"
touch "/var/log/postgresql/$LOG_FILENAME"
chown postgres:postgres "/var/log/postgresql/$LOG_FILENAME"
chmod 644 "/var/log/postgresql/$LOG_FILENAME"

# ensure backup directory exists
mkdir -p /db/backups
chown -R postgres:postgres /db/backups

# fix permissions for cron
mkdir -p /var/run/crond
chown -R root:crontab /var/run/crond
chmod -R 775 /var/run/crond

# start cron in the background
echo "Starting cron..."
/usr/sbin/cron -f &

# debugging output: Check what's in the data directory
echo "Checking /var/lib/postgresql/data contents:"
ls -lah /var/lib/postgresql/data

# debugging output: Check running processes
echo "Current running processes before PostgreSQL starts:"
ps aux

# check for existing tables and initialize if not found
echo "Checking for existing tables..."
PGPASSWORD="$POSTGRES_PASSWORD" psql -h localhost -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT 1 FROM users LIMIT 1;" >/dev/null 2>&1 || echo "No users table found, skipping check."

if [ $? -ne 0 ]; then
    echo "No existing tables found. Running init scripts..."
    for sql_file in /docker-entrypoint-initdb.d/*.sql; do
        echo "Executing $sql_file..."
        PGPASSWORD="$POSTGRES_PASSWORD" psql -h localhost -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f "$sql_file"
    done
else
    echo "Database already initialized. Skipping init scripts."
fi

# start PostgreSQL
echo "Starting PostgreSQL as user: $POSTGRES_USER"
exec su postgres -c "postgres -D /var/lib/postgresql/data >> /var/log/postgresql/$LOG_FILENAME 2>&1"
