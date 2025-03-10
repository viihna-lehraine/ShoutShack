-- File: db/docker-entrypoint-initdb.d/02-seed-data.sql

INSERT INTO users (username, email, password_hash) VALUES
('user_1', 'website@example.com', 'hashedpassword1'),
('user_2', 'other_place@domain.com', 'hashedpassword2');
