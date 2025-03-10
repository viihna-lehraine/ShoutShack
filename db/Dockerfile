# File: db/Dockerfile

FROM postgres:17.0

# install required packages
RUN apt-get update && apt-get install -y cron procps

# ensure log and backup directories exist and set correct permissions
RUN mkdir -p /var/log/postgresql /var/lib/postgresql/backups /db/backups \
    && chown -R postgres:postgres /var/log/postgresql /var/lib/postgresql/backups /db/backups

# copy configuration files
COPY postgresql.conf /etc/postgresql/postgresql.conf
COPY pg_hba.conf /etc/postgresql/pg_hba.conf
RUN chown postgres:postgres /etc/postgresql/*.conf

# copy initialization scripts (SQL scripts)
COPY docker-entrypoint-initdb.d/ /docker-entrypoint-initdb.d/
RUN chmod -R 755 /docker-entrypoint-initdb.d/

# copy the backup script and entrypoint script
COPY docker-entrypoint-initdb.d/backup.sh /usr/local/bin/backup.sh
COPY docker-entrypoint-initdb.d/entrypoint.sh /usr/local/bin/entrypoint.sh

# ensure scripts are executable
RUN chmod +x /usr/local/bin/backup.sh /usr/local/bin/entrypoint.sh

# set up cron job for automatic backups (every 6 hours)
RUN echo "0 */6 * * * postgres /usr/local/bin/backup.sh" | crontab -u postgres -

# set entrypoint script
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

# default command starts PostgreSQL
CMD ["postgres"]
