# File: db/Dockerfile

FROM postgres:17.0

# install required packages
RUN apt-get update && apt-get install -y cron procps

# ensure backup directory exists and set correct permissions
RUN mkdir -p /var/lib/postgresql/backups /db/backups \
    && chown -R postgres:postgres /var/lib/postgresql/backups /db/backups

# copy configuration files
COPY postgresql.conf /var/lib/postgresql/data/postgresql.conf
COPY pg_hba.conf /var/lib/postgresql/data/pg_hba.conf
RUN chown postgres:postgres /var/lib/postgresql/data/*.conf

# copy initialization scripts
COPY docker-entrypoint-initdb.d/ /docker-entrypoint-initdb.d/
RUN chmod -R 755 /docker-entrypoint-initdb.d/

# copy and configure backup script
COPY docker-entrypoint-initdb.d/backup.sh /usr/local/bin/backup.sh
RUN chmod +x /usr/local/bin/backup.sh

# ensure cron runs in the background
RUN echo "0 */6 * * * postgres /usr/local/bin/backup.sh" | crontab -u postgres -

# start PostgreSQL with cron
CMD ["bash", "-c", "cron && exec postgres"]
