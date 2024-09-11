#!/bin/bash

# prune old Docker resources
echo "Cleaning up old Docker containers, networks, and volumes..."
docker-compose down --rmi all
docker system prune -a --volumes -f
docker network prune -f

echo "Cleanup completed successfully."
