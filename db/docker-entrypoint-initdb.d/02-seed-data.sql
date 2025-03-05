-- File: db/docker-entrypoint-initdb.d/02-seed-data.sql

INSERT INTO users (username, email, password_hash) VALUES
('viihna', 'viihna@example.com', 'hashedpassword1'),
('testuser', 'test@example.com', 'hashedpassword2');
