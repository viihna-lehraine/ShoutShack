#!/bin/sh

# File: db/docker-entrypoint-initdb.d/entrypoint.sh

set -e

echo "Running database entrypoint script..."

# wait for secrets to become available
MAX_RETRIES=10
RETRY_INTERVAL=2

for i in $(seq 1 $MAX_RETRIES); do
    if [ -f "/run/secrets/POSTGRES_DB" ] && [ -f "/run/secrets/POSTGRES_USER" ] && [ -f "/run/secrets/POSTGRES_PASSWORD" ]; then
        POSTGRES_DB=$(cat /run/secrets/POSTGRES_DB)
        POSTGRES_USER=$(cat /run/secrets/POSTGRES_USER)
        POSTGRES_PASSWORD=$(cat /run/secrets/POSTGRES_PASSWORD)
        break
    fi

    echo "Secrets not found. Retrying in $RETRY_INTERVAL seconds... ($i/$MAX_RETRIES)"
    sleep $RETRY_INTERVAL
done

# final check after retries
if [ -z "$POSTGRES_DB" ] || [ -z "$POSTGRES_USER" ] || [ -z "$POSTGRES_PASSWORD" ]; then
    echo "Error: Secrets never became available!" >&2
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

    # ensure PostgreSQL is ready before running commands
    until su postgres -c "pg_isready -q"; do
        echo "Waiting for PostgreSQL to be ready..."
        sleep 1
    done

    # create the database user if it doesn't exist
    echo "Checking if PostgreSQL user exists..."
    su postgres -c "psql -d postgres -c \"
    DO \$\$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '$POSTGRES_USER') THEN
            CREATE USER \\\"$POSTGRES_USER\\\" WITH ENCRYPTED PASSWORD '$POSTGRES_PASSWORD';
        ELSE
            ALTER USER \\\"$POSTGRES_USER\\\" WITH LOGIN;
        END IF;
    END
    \$\$;
    \""

    # create the database if it doesn't exist
    echo "Checking if PostgreSQL database exists..."
    su postgres -c "psql -d postgres -c \"
    DO \$\$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_database WHERE datname = '$POSTGRES_DB') THEN
            CREATE DATABASE \\\"$POSTGRES_DB\\\" OWNER \\\"$POSTGRES_USER\\\";
        END IF;
    END
    \$\$;
    \""

    # ensure user has full privileges on the DB
    su postgres -c "psql -d postgres -c \"GRANT ALL PRIVILEGES ON DATABASE \\\"$POSTGRES_DB\\\" TO \\\"$POSTGRES_USER\\\";\""

    # Debugging output: Verify user and DB creation
    echo "Verifying PostgreSQL user and database creation..."
    echo "PostgreSQL users:"
    su postgres -c "psql -d postgres -c \"SELECT usename FROM pg_user;\""

    echo "PostgreSQL databases:"
    su postgres -c "psql -d postgres -c \"SELECT datname FROM pg_database;\""
fi

# ensure the log directory exists
mkdir -p /var/log/postgresql
chown -R postgres:postgres /var/log/postgresql
chmod 755 /var/log/postgresql

# ensure the log filename matches the expected format
LOG_FILENAME="postgresql.log"
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

# debugging output: check what's in the data directory
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
