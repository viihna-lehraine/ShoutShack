#!/bin/sh

LOG_DIR="/server/logs"
TIMESTAMP=$(date '+%Y-%m-%d_%H%M%S')

# redirect stdout and stderr to log files
exec > >(tee -a "$LOG_DIR/server-$TIMESTAMP.log") 2>&1

while true; do
    NEW_TIMESTAMP=$(date '+%Y-%m-%d_%H%M%S')

    if [ -f "$LOG_DIR/server.log" ]; then
        mv "$LOG_DIR/server.log" "$LOG_DIR/server-$NEW_TIMESTAMP.log"
    fi

    # restart logging
    touch "$LOG_DIR/server.log"

    # rotate logs every hour
    sleep 3600
done
