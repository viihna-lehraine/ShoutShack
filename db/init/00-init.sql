-- ensure the database exists
CREATE DATABASE shoutshack;

-- switch to the ShoutShack Database
\c shoutshack;

-- users Table
CREATE TABLE IF NOT EXISTS users (
	id SERIAL PRIMARY KEY,
	email VARCHAR(255) UNIQUE NOT NULL,
	password TEXT NOT NULL,
	verified BOOLEAN DEFAULT FALSE,
	verification_token TEXT
);
