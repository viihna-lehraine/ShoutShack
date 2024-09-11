#!/bin/bash

# Prunes old Docker resources (helps with stuck networks/containers)

echo "Cleaning up old Docker containers, networks, and volumes..."
docker-compose down --rmi all
docker system prune -a --volumes -f
