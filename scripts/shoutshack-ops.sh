#!/bin/sh

BUILD=false
FULL_REBUILD=false
DESTROY=false
DOCKER_UP=false
DOCKER_UP_DETACHED=false
PUSH_IMAGE=false
BUILD_FAILED=false
DIR_NAME='/home/viihna/Projects/shoutshack'

set -e

cd "$DIR_NAME"

print_ascii_art() {
	echo "                     ____  _                 _   ____  _                _    "
	echo "                    / ___|| |__   ___  _   _| |_/ ___|| |__   __ _  ___ | | __"
	echo "                    \___ \| '_ \ / _ \| | | | __\___ \| '_ \ / _\` |/ __| |/ /"
	echo "                     ___) | | | | (_) | |_| | |_ ___) | | | | (_| | (__|   < "
	echo "                    |____/|_| |_|\___/ \__,_|\__|____/|_| |_|\__,_|\___|_|\_\ "
	echo ""
	echo ".............................................::...:........=**+**:........::.................::::::-"
	echo ".....................................:-=++==+++---:::.....:=*+:..::........::.........::::::::::::::"
	echo ".............................:::-+***+*###************+++-:=*+:...::......:::::::::::::::::::-------"
	echo "......................-++=+++******#****#######*#*#******#*+*+:....:::::::::::::::::::::::::=*=-=+++"
	echo "....................:+****###****#######%%%#*##############*++:.:.:::::::::::::::::::::::::-==::==-+"
	echo "...................-+*#****####*########%%######%#########***+-:::::::::::::::::::::::::::::-=-=+*#%"
	echo "................::-+*########%%######%%%%%%%%%%%%########*+*++-::::::::::::::::::::::::::-=--===+**+"
	echo "............:..:-=+*###%%%##%%%%%#####%%%@@@%%%%%#%#%%%##+-=*+-::::::::::::::::::::::::::==+-=******"
	echo ".............::=*##%%%%%%%%%#####%%###%%%%%@@%%%%%%@%%%#+--=*+-::::::::::::::::::::::::::----=*#**#%"
	echo "............:-*##%##%%%%%%%%%%%%%%%%####%%%%%%%%%%%%%%*=:::+*+-::::===+=:::-:::::::::::::::=-:=+++*+"
	echo ".............=##%%%%@%%%%%###%%##*********++*########*-::::=*+-++--=###+=-=++=-++--=-:::::::+++=-+**"
	echo "............-*%%%%@@@@@@@@%%%##*+============+++++++++=::::+*++#%+++##*****##*##%#*+-:.....-=++*+*%%"
	echo "....::.....:*%%%%@@@%%@@@@@%%#*+==========-==========+=-=--+**##%#%%%%%#%%%%%%%%%%%#*-=::-::-::-=--="
	echo ":::........:*%%%%%%%%%%%%%%##*++=========--=============*+*+**%%%%%%%%%%%%%%@%%%%%%%%#==-:::::-==-=+"
	echo ".......::::-#%%%%%%%%%%%%%%#*+++==========-=============+#*+**%%%%%%@%%%%%%%%@%%%%%@@%+---::::-=*##*"
	echo "=++*********#%%%%%%%%%%%%%##*++++==================++=++*#%%@#%%%%@%@%%@%%%%@@@@@@%@@#=+=-::::--+*=-"
	echo "************#%%%%@%%%%%%%%%#**++++========+#%%@@@@@%%%%@@@@@%#%%%%%@@%%@%@@@@@@@@@@@@%*-=-::::::::::"
	echo "*+++========*%%%%@@@%@%%%%%#*+++++++++#%%#%@@@@@@@@@@@@@@@@@%#%@@%@@@@@@@@@@@@@@@@@%@%#*+---::::::::"
	echo "+***********#%%%@@@@@%%%%%######%%@@@@@@@@@@@@@@@@@@%++%@@@@##%@@@@@@@@@@@@@@@@@%@@@@@@%%*#**+=+----"
	echo "++++++++++++*%@@@@@%%%%@@@@@@@@@%%###%%%%@@@@@@@@@@%*===#%%#*#%%%@@@@@@@@@@@@@@@@@@@@@@%%%%%%%%%%##+"
	echo "+++++++++=+++%@@%%%**+++#####*++++++=+*##%%@@@@@@%%++=====+***+**+*#%%@@@@@@@@@@@@@@@%@@@@@@@@@@@@@@"
	echo "%%%#*#***=+++#%@@%%++++*+**###*+++++=====+**####*+++++====+***+++*+++++*#%@@@@@@@@@@@@@@@@@@@@@@@@@@"
	echo "%###****+=+++*%@@@%*+=++*++*##*++++++=============++++==+++***+++++++++++++*#%@@@@@@@@@@@@%%%%%%@@@@"
	echo "%###**+*++++++*%@@@#*++=+*++*##*+++++++===========+***##*****#%%%%%%%%%@@%@@@@@@@@@@@@@@%#******@@@%"
	echo "%###**+*+=++=++#%@@@%*++===+*#%#*+++++++=============+++****#%#%%%%#%##@@#%@%############*+++++*@@%#"
	echo "%###**+*+======+#%@@@%#*++=+*##%*++++++++============+*###*+*#+==**#%##@%****#######%####*+++++*@@%#"
	echo "==========+++++++*%@@@%%####*####*+++++++=========++*###*+==::=+##*#%%#%%*##########%%%##*+===+*@@##"
	echo "+++++++++++++++++++*#%%##**####%%##*++++++=======+*****##**+++*###*#%##%%*##########%%%##+===++*@%##"
	echo "+++++++++++++++++++++*#*****###%%###**++++++++===+*+++==+#%*++==++*#******#%%%%#########*+===+++++++"
	echo "++++++++++++++++++++*********##########*++++++===+*+===+**##*++===+****++*%@%%%%%%%%%%%%#+++++++++++"
	echo "===================+**++******#####******+++++++++++++**++++========######%@@%%%%%%%%%%%*++*++**++++"
	echo "===========++++=--=++*+++++*****######*****+++++++++++*#%##***+++====+%@@@@%#####***################"
	echo "=========*#*##=----++++++++++++***########****++++++++*#%%%@%%%#*++====#@@@*************************"
	echo "------=##**#%%@#=--=+*++=+++++++++****#########**####%%%%%@@#+===========*###***********************"
	echo "::::-*%#****#@@@%*--=+*++========++++***###%%%%@@@@@@@@@@@@#*%%###*+++++=+=+********************####"
	echo "::-#%#*#**#@%%@@@@%+-=++*+========+++++**##%%%%@@@%@@%#@@@@@@%%%%%%%%%**++==+**************#########"
	echo "-*###%####%@%%%%%@#%#+=+++*+=====++=++++++*#%%%%@#+***%@@@@@@#%%%%%%%%#*++===+***#%###***###**######"
	echo " #%#+#*###%%%%%%%%%##@@#=++=+**========++++****%%#%*++****%%%#******##%%#*++===+++%@%@@@@@%#*+++*%@@#"
	echo "*#*%#%%%@@@@@@%%%@@%%%#%#*+*+=+*+*+++++***++=+*%%%@#**++++++*++++++**##**++====+#%%%%@@@@#+*****##%@"
	echo "##%%%@@%%@@@@@%%%@@%@@%%@#%%%*+======++++======*@#@@@%#*++++*+++++++*###*+++===++*******###%%%%%%%##"
	echo "#%@@%@%@@@%@%%**#%%@%%%%%%%#@@%+===============+#**@@@@@%****++++++++*###*+++++=++******************"
	echo "%@@@@@@@%%%%%**#%@@%@@%%%###%@@*%*=============+%@*#@@@@@@@%#***++++++*###**+++++=+*****************"
	echo "@@@@%%**%#%%%@@@@@@@@@%%%##%+#%%#%#+===========+%@%*@@@@@+%@@%%#*************+++++===+****##********"
	echo "%@@@%#***#%%%@@%####%@@@%%##==+##%%#++=========*@@%#@@@@@@@@@%#@@%%####%###*****++===++++++++++*****"
	echo "@%@@@%####%#@@%######%@%%%%%%%%%%%#%%%*========#@@##@@@@@@@@@@@@@@@@@@@%%#%%##*+++===++*##********##"
	echo "@@@@@%@@@@@@@@@%%##%%+%@@%%%%%%@#@%%@%#+*======####@@@@@@@%%@@@@@@@@@@@@%#*+**++++===++####*********"
	echo "##%@%#@@@@@@@@@@%%#%%%%%%@@@%%#%#%#%%@%#%#*====###%@@@@@@@@%@@#%@%%%@@@@@%#***++=====+*##%%#********"
	echo "*%**@%#@@@@#%%#%@@@@@@@@@@@@@@%%#%%=+@@@@@@%*+++#@@@@**@@@@%@@%*#@%%%@%#%@@#**+++====+%@@@@%#%%#****"
	echo "#%%**@%%@@##%%%#%@@@@@%%%##%%@@%%#%=+%%@@@@%%%*%@@@@%%@@@@@%#@@*++#%%%%%%%@%#**++++==#@@@@@@@%@%#***"
	echo "%%##*%@@%@%#**###%@@@@#%#%%%%%@@@%%%%#%@@@@@%%%@@@@@@@@@@@@@#%@@@%%%@%#%%@@@%#**++++*%%%@@#%@@#*%##*"
	echo "%%#%#%@@@@@%%####%@@@####*#%%%@#%@@@@%%%%%@@@%%%@@@@@@@@@@@@@@@%##%%%@##%%%%%%#*++++#%%#%%%%%@@%%#%*"
	echo "@@%%%%@@%%@@@@%@@@%##%%%%%###%@@@@@@%%%@%%%@@@%@@@@@@@@@@@@@%#%#+%%%@@@**#%@%%#**++*#%%%%%#%@#%%%%#%"
	echo "@@@@@@@@%%##%@@@@%######%@@@@%@@@@@@@@%%%%+@@@%%@@@@@@@@@@@@@@@%#%%%@@@@@@@%%@@*++++*#%%%@%#%%##%@@@"
	echo "@@@@@@@@%%%*#%@@@@@%@@#*%@@@@@%@@@@@@@%%%**@@@%@@@@@@==#@@@@@%#%@%%@%@@@@@@@@@%%*+++++*#%%@@@%%%%%@%"
	echo "@@@@@@@@@@@%%@@@@@@@@@@@@@%%%#*#@@@%%%%%@#=+@@%%%@@@@@%@@@@@@@@%#@%%%%%@@@@@@@@%%#*++++++*%@@@%%%@#%"
	echo ""
}

print_help() {
	echo "📖 **ShoutShack Ops - DevOps Control Script**"
	echo "Usage: **ShSh** [options] OR just run **ShSh** for interactive mode."
	echo ""
	echo "🔹 **General Options**"
	echo "  -h           Show this help menu"
	echo ""
	echo "🔹 **Build & Rebuild**"
	echo "  -b           Build the backend server"
	echo "  -B           Full rebuild (stops, rebuilds, and starts all containers fresh)"
	echo ""
	echo "🔹 **Docker Management**"
	echo "  -d           Destroy all containers and volumes (⚠️ Destroys everything!)"
	echo "  -u           Start Docker containers in foreground"
	echo "  -U           Start Docker containers in detached mode (background)"
	echo "  -p           Push latest backend image to Docker Hub"
	echo ""
	echo "🔹		**Interactive Commands (once running)**"
	echo "  down                 	Stop all running Docker containers"
	echo "  restart              	Restart all containers"
	echo "  restart-service <name>	Restart a specific service"
	echo "  rebuild <name>       	Rebuild a specific service"
	echo "  logs <name>          	Show logs for a specific service"
	echo "  status               	Show running container status"
	echo "  shell <name>         	Enter a running container's shell"
	echo "  prune                	Delete ALL unused images, volumes, and containers (⚠️ Warning)"
	echo "  exit                 	Quit interactive mode without stopping containers"
	echo ""
}

rebuild_container() {
	CONTAINER=$1
	if [ "$CONTAINER" = "all" ]; then
		echo "Rebuilding all containers..."
		docker compose stop
		docker compose rm -f
		docker compose build --no-cache
		docker compose up -d
	else
		echo "Rebuilding container: $CONTAINER"
		docker compose stop "$CONTAINER"
		docker compose rm -f "$CONTAINER"
		docker compose build --no-cache "$CONTAINER"
		docker compose up -d "$CONTAINER"
	fi
}

while getopts ":bBdUuph" opt; do
	case "$opt" in
	b) BUILD=true ;;
	B) FULL_REBUILD=true ;;
	d) DESTROY=true ;;
	u) DOCKER_UP=true ;;
	U) DOCKER_UP_DETACHED=true ;;
	p) PUSH_IMAGE=true ;;
	h)
		print_help
		;;
	*)
		echo "❌ Invalid option: -$OPTARG"
		exit 1
		;;
	esac
done

if [ "$BUILD" = true ]; then
	echo "Building backend server..."
	(cd backend && pnpm run build) || {
		echo "❌ Server build failed!"
		BUILD_FAILED=true
	}
fi

if [ "$FULL_REBUILD" = true ]; then
	echo "Performing full rebuild..."
	if ! (cd backend && pnpm run build); then
		echo "❌ Server build failed!"
		BUILD_FAILED=true
	fi

	echo "📴 Stopping and rebuilding Docker containers..."
	docker compose down
	docker compose build --no-cache
	docker compose up -d
	echo "✅ Full rebuild complete."

	if [ "$BUILD_FAILED" = true ]; then
		echo "🚨 Build failed. Exiting..."
		exit 1
	fi
fi

if [ "$DESTROY" = true ]; then
	echo "Destroying all containers and volumes..."
	docker compose down -v
	echo "All containers and volumes removed."
fi

if [ "$DOCKER_UP" = true ]; then
	echo "Starting Docker containers in foreground..."
	docker compose up
fi

if [ "$DOCKER_UP_DETACHED" = true ]; then
	echo "Starting Docker containers in detached mode..."
	docker compose up -d
fi

if [ "$PUSH_IMAGE" = true ]; then
	echo "Pushing latest server image to Docker Hub..."
	docker tag shoutshack-backend:latest viihnatech/shoutshack-backend:latest
	docker push viihnatech/shoutshack-backend:latest
	echo "Image pushed successfully."
fi

if [ -z "$STARTED" ]; then
	print_ascii_art
	STARTED=true
fi

echo "---------------------------------------------------------"
echo "Enter a command, or type **help** for a list of commands."

while true; do
	printf "\n🔹 ShSh > "
	read -r CMD ARGS
	case "$CMD" in
	help)
		print_help
		;;
	down)
		echo "Stopping Docker containers..."
		docker compose down
		;;
	restart)
		echo "Restarting Docker containers..."
		docker compose down && docker compose up --build -d &
		sleep 3
		;;
	restart-service)
		if [ -z "$ARGS" ]; then
			echo "❌ Please specify a service to restart."
		else
			echo "Restarting service(s): $ARGS"
			docker restart "$ARGS"
		fi
		;;
	rebuild)
		if [ -z "$ARGS" ]; then
			echo "❌ Please specify a container to rebuild (or 'all' for all containers)."
		else
			rebuild_container "$ARGS"
		fi
		;;
	logs)
		if [ -z "$ARGS" ]; then
			echo "❌ Please specify a service to show logs."
		else
			echo "Showing logs for service: $ARGS"
			docker compose logs -f "$ARGS"
		fi
		;;
	status)
		echo "Docker container status:"
		docker ps --format "table {{.Names}}\t{{.Ports}}\t{{.Status}}"
		;;
	shell)
		if [ -z "$ARGS" ]; then
			echo "❌ Please specify a container to enter."
		else
			echo "Entering shell of container: $ARGS"
			docker exec -it "$ARGS" sh
		fi
		;;
	prune)
		echo "WARNING: This will delete ALL unused images, volumes, and containers!"
		echo "Type 'yes' to confirm:"
		read -r CONFIRM
		if [ "$CONFIRM" = "yes" ]; then
			docker system prune -af
			echo "Docker system pruned."
		else
			echo "Aborted."
		fi
		;;
	exit)
		echo "Exiting interactive mode (without stopping containers)."
		exit 0
		;;
	*)
		echo "❌ Unknown command: '$CMD'. Type 'help' for available commands."
		SUGGESTED=$(echo "down restart restart-service rebuild logs status shell prune exit" | tr ' ' '\n' | grep -i "^$CMD" | head -1)
		[ -n "$SUGGESTED" ] && echo "🔹 Did you mean: '$SUGGESTED'?"
		;;
	esac
done
