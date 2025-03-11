#!/bin/bash

# File: docker.sh

# ShoutShack Docker Management Script
# Built for speed, reliability, and convenience
# Why? BECAUSE DOCKER IS MADE BY JOYLESS SADISTS
# Author: Viihna Lehraine

set -e

cd /home/viihna/viihnaFolders/cs-work/projects/shoutshack-v3/

# log messages with timestamps
log() {
    echo -e "\033[1;34m[$(date +"%T")] $1\033[0m"
}

# check if Docker is running
if ! docker info &>/dev/null; then
    log "ERROR! Docker is not running. Please start Docker and try again."
    exit 1
fi

# fetch services from docker-compose.yml or fallback
IMAGES=($(docker compose config --services 2>/dev/null || echo "db frontend nginx server"))

# build images with Buildx Bake (parallelized)
build_images() {
    log "Building all images with Buildx Bake..."
    DOCKER_BUILDKIT=1 docker buildx bake --no-cache --progress=plain

	# ensure images exist before tagging them
    for img in db frontend server nginx; do
        IMAGE_ID=$(docker images --all --quiet | head -n 1)
        if [ -n "$IMAGE_ID" ]; then
            docker tag "$IMAGE_ID" shoutshack-v3-$img:latest
            log "Tagged shoutshack-v3-$img:latest"
        else
            log "WARNING: shoutshack-v3-$img was not built properly!"
        fi
    done
}

# build individual image
build_image() {
    echo "Building $1 image..."
    if DOCKER_BUILDKIT=1 docker buildx bake --no-cache --progress=plain "$1"; then
        echo "$1 image built successfully."
    else
        echo "Error building $1 image."
        exit 1
    fi
}

# 💥 nuke entire Docker environment (use with caution!)
nuke() {
    log "🔥☠️🔥 DOCKER IS ABOUT TO GET FLATTENED. HASTA LA VISTA, BITCH 🔥☠️🔥"
    sleep 2
    docker stop $(docker ps -aq) 2>/dev/null || true
    docker rm $(docker ps -aq) 2>/dev/null || true
    docker rmi -f $(docker images -q) 2>/dev/null || true
    docker volume rm $(docker volume ls -q) 2>/dev/null || true
    docker builder prune --all --force || true
    log "🔥 THE DOCKER ENVIRONMENT HAS BEEN OBLITERATED. YOU'RE WELCOME 🔥"
}

# clean up unused containers, images, and volumes
prune() {
    log "Cleaning up Docker system..."
    docker system prune -af --volumes
}

# forces prune step
prune_force() {
	log "Force pruning Docker System..."
	docker builder prune --all --force
}

# push images to Docker Hub
push_image() {
    log "Pushing $1 image to Docker Hub..."
    if docker push viihnatech/shoutshack-$1:latest; then
        log "$1 image pushed successfully."
    else
        log "ERROR! Could not push $1 image."
        exit 1
    fi
}

# pull latest images (useful for multi-dev environments)
pull_services() {
    log "Pulling latest images from Docker Hub..."
    docker compose pull
}

# restart services without rebuilding
restart_up() {
    log "Starting Docker Compose services from local files..."
    if docker compose up -d --no-build; then
        log "Services started successfully."
    else
        log "ERROR! Unable to start services."
        exit 1
    fi
}

# start services (rebuild if needed)
start_services() {
    log "Starting Docker Compose services..."
    if docker compose up -d --build; then
        log "Services started successfully."
    else
        log "ERROR! Unable to start services!"
        exit 1
    fi
}

# stop services
stop_services() {
    log "Stopping Docker Compose services..."
    if docker compose down -v --remove-orphans; then
        log "Services stopped successfully."
    else
        log "ERROR! Unable to stop services!"
        exit 1
    fi
}

# check status of running containers
status() {
    log "Checking Docker status..."
    docker ps --format "table {{.ID}}\t{{.Names}}\t{{.Status}}\t{{.Ports}}"
}

# command router
case "$1" in
    start)
		start_services
		;;
    start_local)
		restart_up
	;;
    stop)
		stop_services
	;;
    restart)
		stop_services
		restart_up
	;;
    build)
		build_images
		;;
	rebuild)
		stop_services
		build_images
		restart_up
		;;
    prune)
		prune
	;;
	prune_force)
		prune_force
	;;
    push)
		for img in "${IMAGES[@]}"; do push_image "$img";
		done
	;;
    nuke)
		nuke
	;;
    status)
		status
		;;
    pull)
		pull_services
		;;
    build_*)
		build_image "${1#build_}"
		;;
    push_*)
		push_image "${1#push_}"
		;;
    *)
    	log "❓ Usage: $0 {start|stop|restart|build|push|nuke|prune|prune_force|rebuild|status|start_local|pull|build_<service>|push_<service>}"
    	exit 1
    	;;
esac

exit 0
