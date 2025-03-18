#!/bin/sh

BUILD=false
FULL_REBUILD=false
DESTROY=false
DOCKER_UP=false
DOCKER_UP_DETACHED=false
PUSH_IMAGE=false
INTERACTIVE=false
BUILD_FAILED=false
DIR_NAME='/home/viihna/Projects/shoutshack'

set -e

cd "$DIR_NAME"

while getopts "bBdUupi h" opt; do
	case "$opt" in
	b) BUILD=true ;;
	B) FULL_REBUILD=true ;;
	d) DESTROY=true ;;
	u) DOCKER_UP=true ;;
	U) DOCKER_UP_DETACHED=true ;;
	p) PUSH_IMAGE=true ;;
	i) INTERACTIVE=true ;;
	h)
		echo "📖 Usage Guide: ./shoutshack-ops.sh [options]"
		echo ""
		echo "Available options:"
		echo "  -b   Build the backend server (without full rebuild)"
		echo "  -B   Full rebuild (clears cache, rebuilds containers)"
		echo "  -d   Destroy all containers and volumes"
		echo "  -u   Start Docker in foreground mode"
		echo "  -U   Start Docker in detached mode"
		echo "  -p   Push the latest backend server image to Docker Hub"
		echo "  -i   Interactive mode (allows live control of containers)"
		echo "  -h   Show this help message"
		exit 0
		;;
	*)
		echo "❌ Invalid option: -$OPTARG"
		echo "ℹ️  Use '-h' for usage guide."
		exit 1
		;;
	esac
done

if [ "$BUILD" = true ]; then
	echo "🛠️  Building backend server..."
	(cd backend && pnpm run build) || {
		echo "❌ Server build failed!"
		BUILD_FAILED=true
	}
fi

if [ "$FULL_REBUILD" = true ]; then
	echo "🔄 Performing full rebuild..."
	if ! (cd backend && pnpm run build); then
		echo "❌ Server build failed!"
		BUILD_FAILED=true
	fi

	echo "📴 Stopping and rebuilding Docker containers..."
	docker compose down
	docker compose build --no-cache
	docker compose up -d
	echo "✅ Full rebuild complete."

	if [ "$BUILD_FAILED" = true ] && [ "$INTERACTIVE" = false ]; then
		echo "🚨 Build failed. Exiting..."
		exit 1
	fi

	if [ "$BUILD_FAILED" = true ] && [ "$INTERACTIVE" = true ]; then
		echo "⚠️  Build failed, but entering interactive mode anyway..."
	fi

	[ "$INTERACTIVE" = false ] && exit 0
fi

if [ "$DESTROY" = true ]; then
	echo "💥 Destroying all containers and volumes..."
	docker compose down -v
	echo "✅ All containers and volumes removed."
	exit 0
fi

if [ "$DOCKER_UP" = true ]; then
	echo "🚀 Starting Docker containers in foreground..."
	docker compose up
	exit 0
fi

if [ "$DOCKER_UP_DETACHED" = true ]; then
	echo "🔄 Starting Docker containers in detached mode..."
	docker compose up -d
	[ "$INTERACTIVE" = false ] && exit 0
fi

if [ "$PUSH_IMAGE" = true ]; then
	echo "📤 Pushing latest server image to Docker Hub..."
	docker tag shoutshack-backend:latest viihnatech/shoutshack-backend:latest
	docker push viihnatech/shoutshack-backend:latest
	echo "✅ Image pushed successfully."
	exit 0
fi

if [ "$INTERACTIVE" = true ]; then
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
			docker compose down && docker compose up --build -d &
			sleep 3
			;;
		logs)
			echo "📜 Showing logs (Press ENTER to return to menu)..."
			(docker compose logs -f) </dev/tty
			;;
		status)
			echo "📊 Docker container status:"
			docker ps
			;;
		shell)
			echo "🐚 Attaching to running container..."
			docker exec -it shoutshack-server-1 sh
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
fi

echo "⚡ No valid options provided. Use '-h' for help."
exit 1

# 📖 Quick Reference:
# - (no args)		→ Starts Docker (no build), then exits
# -b				→ Builds the server, then exits (unless build fails)
# -B				→ Full rebuild (clears cache, rebuilds containers)
# -d				→ Destroys all containers & volumes
# -u				→ Start Docker in foreground mode
# -U				→ Start Docker in detached mode
# -p				→ Push the latest server image to Docker Hub
# -i				→ Interactive mode (live control of containers)
# -b -i				→ Builds the server, then enters interactive mode
# -B -i				→ Full rebuild, then enters interactive mode
# -h				→ Display usage guide
