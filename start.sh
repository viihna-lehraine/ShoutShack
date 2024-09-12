#!/bin/bash

# check if Docker is installed
if ! [ -x "$(command -v docker)" ]; then
  echo "Error: Docker is not installed." >&2
  exit 1
fi

# check if Docker Compose is installed
if ! [ -x "$(command -v docker-compose)" ]; then
  echo "Error: Docker Compose is not installed." >&2
  exit 1
fi

# prompt for clean or deep-clean
read -p "Do you want to perform a clean (remove old containers, networks, and non-essential volumes) (y/n)? " run_clean

read -p "Do you want to perform a deep clean (remove all stopped containers, networks, unused volumes, and build cache) (y/n)? " run_deep_clean

# prompt to remove guestbook_pgdata volume explicitly
read -p "Do you want to remove the guestbook_pgdata volume (y/n)? " remove_pgdata

# map services to numbers
declare -A services_map
services_map=(
  [1]="backend"
  [2]="frontend"
  [3]="nginx"
  [4]="db"
  [5]="redis"
)

# display available services
echo "Available services:"
for num in "${!services_map[@]}"; do
    echo "$num) ${services_map[$num]}"
done

# prompt for which services to compose
read -p "Enter the numbers corresponding to the services you'd like to run (e.g., 1 2 3): " selected_numbers

# Now execute the commands after collecting all inputs

# perform clean if selected
if [[ "$run_clean" == "y" ]]; then
    echo "Cleaning up old Docker containers, networks, and non-essential volumes..."
    docker-compose down --remove-orphans
    docker network prune -f
    docker volume rm guestbook_guestbook-backend-node-modules guestbook_guestbook-frontend-node-modules guestbook_guestbook-nginx-logs
    echo "Cleanup completed successfully."
fi

# perform deep clean if selected
if [[ "$run_deep_clean" == "y" ]]; then
    echo "Performing deep clean (removing all stopped containers, networks, unused volumes, and build cache)..."
    docker system prune -a --volumes -f
    echo "Deep clean completed successfully."
fi

# stop and remove all Docker Compose services and volumes (without removing all volumes)
docker-compose down

# remove guestbook_pgdata volume if selected
if [[ "$remove_pgdata" == "y" ]]; then
    docker volume rm guestbook_pgdata
fi

# define the .env file
ENV_FILE="./docker.env"

# check if the env file exists
if [ ! -f "$ENV_FILE" ]; then
  echo "Error: Environment file '$ENV_FILE' not found."
  exit 1
fi

echo "Environment file found. Loading environment variables."

# export environment variables from the .env file
set -a
source "$ENV_FILE"
set +a

echo "All required environment variables are set."

# create Docker network if missing
echo "Ensuring Docker network exists..."
docker network inspect guestbook_app-network >/dev/null 2>&1 || docker network create guestbook_app-network

# map selected numbers to service names
selected_services=""
for num in $selected_numbers; do
    if [[ -n "${services_map[$num]}" ]]; then
        selected_services+="${services_map[$num]} "
    fi
done

# check if no services were selected
if [ -z "$selected_services" ]; then
    echo "No valid services selected, composing all."
    docker-compose up --build -d
else
    echo "Starting Docker Compose for selected services: $selected_services"
    docker-compose up --build -d $selected_services
fi

# check for errors in Docker Compose
if [ $? -ne 0 ]; then
  echo "Error starting Docker Compose."
  exit 1
fi

echo "Docker Compose started successfully."

# show Docker Compose services
docker-compose ps

# show Docker Compose logs
docker-compose logs --tail=100
