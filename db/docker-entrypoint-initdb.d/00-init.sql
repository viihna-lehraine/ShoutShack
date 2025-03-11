-- File: db/docker-entrypoint-initdb.d/00-init.sql

-- ensure role exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'viihna') THEN
        EXECUTE format('CREATE ROLE %I WITH LOGIN ENCRYPTED PASSWORD %L', 'viihna', 'fZc5QxKFt0J2lxlcZMxyOiLx');
    END IF;
END $$;

-- ensure database exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'shoutshack') THEN
        CREATE DATABASE shoutshack OWNER viihna;
    END IF;
END $$;

-- grant privileges to user
GRANT ALL PRIVILEGES ON DATABASE shoutshack TO viihna;
