#!/bin/bash

set -e

DIR='/home/viihna/Projects/shoutshack'

cd $DIR || exit

if [ $# -eq 0 ]; then
	echo "Usage: $0 <partial_container_name> [<partial_container_name> ...]"
	exit 1
fi

for partial_name in "$@"; do
	container=$(docker ps --format "{{.Names}}" | grep "$partial_name")

	if [ -n "$container" ]; then
		echo "Reloading $container..."
		docker exec "$container" nginx -s reload 2>/dev/null || echo "Failed to reload $container (unsupported command)"
	else
		echo "Error: No running container matching '$partial_name' found."
	fi
done
