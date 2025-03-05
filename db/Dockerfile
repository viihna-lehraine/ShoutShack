# db/Dockerfile

FROM postgres:17.0

# install required packages
RUN apt-get update && apt-get install -y cron

# copy config files
COPY postgresql.conf /etc/postgresql/postgresql.conf
COPY pg_hba.conf /etc/postgresql/pg_hba.conf

# copy backup script and make executable
COPY backup.sh /usr/local/bin/backup.sh
RUN chmod +x /usr/local/bin/backup.sh

# ensure permissions
RUN chown postgres:postgres /etc/postgresql/*.conf

# copy entrypoint script
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# copy init scripts
COPY init/*.sql /docker-entrypoint-initdb.d/

# create cron job for automatic backups (every 6 hours)
RUN echo "0 */6 * * * postgres /usr/local/bin/backup.sh" | crontab -u postgres -

# set entrypoint script
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

# start PostgreSQL
CMD ["postgres", "-c", "config_file=/etc/postgresql/postgresql.conf"]
