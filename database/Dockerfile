FROM postgres:latest

COPY ./database/postgresql.conf /usr/local/share/postgresql/postgresql.conf
COPY ./database/pg_hba.conf /usr/local/share/postgresql/pg_hba.conf

RUN mkdir -p /var/lib/postgresql/data

ENV POSTGRES_DB=shoutshackDB
ENV POSTGRES_USER=shoutshack_admin
ENV POSTGRES_PASSWORD=${DB_PASSWORD}

CMD ["postgres", "-c", "config_file=/usr/local/share/postgresql/postgresql.conf"]
