-- File: db/docker-entrypoint-initdb.d/03-indexes.sql

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_logs_user ON logs(user_id);
