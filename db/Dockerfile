# File: db/Dockerfile

FROM postgres:17.0

# install required packages
RUN apt-get update && apt-get install -y cron procps

# ensure backup directory exists and set correct permissions
RUN mkdir -p /var/lib/postgresql/backups /db/backups \
    && chown -R postgres:postgres /var/lib/postgresql/backups /db/backups

# copy configuration files
COPY postgresql.conf /etc/postgresql/postgresql.conf
COPY pg_hba.conf /etc/postgresql/pg_hba.conf
RUN chown postgres:postgres /etc/postgresql/*.conf

# copy initialization scripts
COPY docker-entrypoint-initdb.d/ /docker-entrypoint-initdb.d/
RUN chmod -R 755 /docker-entrypoint-initdb.d/

# copy backup script
COPY docker-entrypoint-initdb.d/backup.sh /usr/local/bin/backup.sh
RUN chmod +x /usr/local/bin/backup.sh

# set up cron job for automatic backups (every 6 hours)
RUN echo "0 */6 * * * postgres /usr/local/bin/backup.sh" | crontab -u postgres -

# use default Postgres entrypoint
ENTRYPOINT ["docker-entrypoint.sh"]

# default command starts PostgreSQL
CMD ["postgres"]
