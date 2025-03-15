#!/bin/sh

BUILD=false
DIR_NAME='/home/viihna/Projects/shoutshack'

set -e

cd "$DIR_NAME"

while getopts "b" opt; do
	case "$opt" in
	b) BUILD=true ;;
	*)
		echo "Invalid option: -$OPTARG" >&2
		exit 1
		;;
	esac
done

if [ "$BUILD" = true ]; then
	echo "Building frontend..."
	(cd frontend && npm run build) || {
		echo "❌ Frontend build failed!"
		exit 1
	}

	echo "Building server..."
	(cd server && npm run build) || {
		echo "❌ Server build failed!"
		exit 1
	}
fi

echo "Starting Docker containers..."
docker compose up --build &

# Wait for Docker to initialize
sleep 3

# Attach a new interactive session to follow logs
echo "✅ Docker is running. Type 'down' to stop containers."
echo "-----------------------------------------------------"

while true; do
	read -r CMD
	case "$CMD" in
	down)
		echo "📴 Stopping Docker containers..."
		docker compose down
		exit 0
		;;
	restart)
		echo "🔄 Restarting Docker containers..."
		docker compose down && docker compose up --build &
		sleep 3
		;;
	logs)
		echo "📜 Showing logs (Ctrl+C to exit logs)..."
		docker compose logs -f
		;;
	status)
		echo "📊 Docker container status:"
		docker ps
		;;
	shell)
		echo "🐚 Attaching to running container..."
		docker exec -it shoutshack-v3-server-1 sh
		;;
	exit)
		echo "❌ Exiting without stopping Docker."
		exit 0
		;;
	*)
		echo "❔ Unknown command. Available commands: down, restart, logs, status, shell, exit"
		;;
	esac
done
