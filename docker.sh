# This file is part of ShoutShack.
#
# ShoutShack is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# ShoutShack is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with ShoutShack. If not, see <https://www.gnu.org/licenses/>.


#!/bin/bash

case "$1" in
    start)
        echo "Starting Docker containers..."
        docker compose up -d
        ;;
    stop)
        echo "Stopping Docker containers..."
        docker compose down
        ;;
    restart)
        echo "Restarting Docker containers..."
        docker compose down
        docker compose up -d
        ;;
    rebuild-db)
        echo "Rebuilding database container..."
        docker compose down db
        docker compose build db
        docker compose up -d db
        ;;
    rebuild-all)
        echo "Rebuilding all containers..."
        docker compose down
        docker compose build
        docker compose up -d
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|rebuild-db|rebuild-all}"
        exit 1
        ;;
esac
exit 0
