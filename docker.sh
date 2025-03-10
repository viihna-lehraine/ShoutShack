#!/bin/bash

set -e

cd /home/viihna/viihnaFolders/cs-work/projects/shoutshack-v3/

if ! docker info > /devnull 2>&1; then
	echo "Docker is not running. Please start Docker and try again."
	exit 1
fi

if ! docker info | grep -q "Username"; then
    echo "You are not logged into Docker. Please log in using 'docker login'."
    exit 1
fi

IMAGES=("db" "frontend" "nginx" "server")

build_image() {
	echo "Building $1 image..."
	if docker build --no-cache -t viihnatech/shoutshack-$1:latest ./$1; then
		echo "$1 image built successfully."
	else
		echo "Error building $1 image."
		exit 1
	fi
}

push_image() {
	echo "Pushing $1 image to Docker Hub..."
	if docker push viihnatech/shoutshack-$1:latest; then
		echo "$1 image pushed successfully."
	else
		echo "Error pushing $1 image."
		exit 1
	fi
}

case "$1" in
    deploy)
        echo "Deploying Docker Swarm..."
        if docker stack deploy -c docker-stack.yml shoutshack; then
            echo "Docker Swarm deployed successfully."
        else
            echo "Error deploying Docker Swarm."
            exit 1
        fi
        ;;
    remove)
        echo "Scaling down Docker services to 0..."
        for img in "${IMAGES[@]}"; do
    		docker service scale shoutshack_$img=0 &
		done
		wait
        echo "Removing Docker Swarm..."
        if docker stack rm shoutshack; then
            echo "Docker Swarm removed successfully."
        else
            echo "Error removing Docker Swarm."
            exit 1
        fi
        ;;
    restart)
        echo "Terminating then re-deploying Docker Swarm..."
        for img in "${IMAGES[@]}"; do
            if docker service scale shoutshack_$img=0; then
                echo "$img service scaled to 0."
            else
                echo "Error scaling down $img service."
                exit 1
            fi
        done
        if docker stack rm shoutshack && docker stack deploy -c docker-stack.yml shoutshack; then
            echo "Docker Swarm restarted successfully."
        else
            echo "Error restarting Docker Swarm."
            exit 1
        fi
        ;;
    build)
        for img in "${IMAGES[@]}"; do
            build_image "$img"
        done
        ;;
    push)
        for img in "${IMAGES[@]}"; do
            push_image "$img"
        done
        ;;
    build_db)
        build_image "db"
        ;;
    build_frontend)
        build_image "frontend"
        ;;
    build_nginx)
        build_image "nginx"
        ;;
    build_server)
        build_image "server"
        ;;
    push_db)
        push_image "db"
        ;;
    push_frontend)
        push_image "frontend"
        ;;
    push_nginx)
        push_image "nginx"
        ;;
    push_server)
        push_image "server"
        ;;
    *)
        echo "Usage: $0 {deploy|remove|restart|build|push|build_db|build_frontend|build_nginx|build_server|push_db|push_frontend|push_nginx|push_server}"
        exit 1
        ;;
esac

exit 0
