#!/bin/sh

LOG_DIR="/var/log/nginx"

while true; do
    TIMESTAMP=$(date '+%Y-%m-%d_%H%M%S')

    if [ -f "$LOG_DIR/access.log" ]; then
        mv "$LOG_DIR/access.log" "$LOG_DIR/access-$TIMESTAMP.log"
    fi

    if [ -f "$LOG_DIR/error.log" ]; then
        mv "$LOG_DIR/error.log" "$LOG_DIR/error-$TIMESTAMP.log"
    fi

    # signal Nginx to reopen logs
    nginx -s reopen

    # rotate logs every hour
    sleep 3600
done
