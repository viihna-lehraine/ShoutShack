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

while getopts "bBdUupi:h" opt; do
	case "$opt" in
	b) BUILD=true ;;
	B) FULL_REBUILD=true ;;
	d) DESTROY=true ;;
	u) DOCKER_UP=true ;;
	U) DOCKER_UP_DETACHED=true ;;
	p) PUSH_IMAGE=true ;;
	i) INTERACTIVE=true ;;
	h)
		print_ascii_art
		echo "📖 ShoutShack Ops - DevOps Control Script"
		echo "Usage: ShSh [options]"
		echo "Options:"
		echo "  -b       Build the backend server"
		echo "  -B       Full rebuild"
		echo "  -d       Destroy all Docker containers"
		echo "  -u       Start Docker containers in foreground"
		echo "  -U       Start Docker containers in detached mode"
		echo "  -p       Push image to Docker Hub"
		echo "  -i       Interactive mode"
		;;
	*)
		echo "❌ Invalid option: -$OPTARG"
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
			echo "Stopping Docker containers..."
			docker compose down
			exit 0
			;;
		restart)
			echo "Restarting Docker containers..."
			docker compose down && docker compose up --build -d &
			sleep 3
			;;
		restart-service)
			echo "Restarting a specific service... (Enter name)"
			read -r SERVICE
			docker restart "$SERVICE"
			;;
		rebuild)
			echo "Rebuilding a specific service... (Enter name)"
			read -r SERVICE
			docker compose up -d --build "$SERVICE"
			;;
		logs)
			echo "Showing logs for a service (Press ENTER to return to menu)..."
			read -r SERVICE
			(docker compose logs -f "$SERVICE") </dev/tty
			;;
		status)
			echo "Docker container status:"
			docker ps --format "table {{.Names}}\t{{.Ports}}\t{{.Status}}"
			;;
		shell)
			echo "Entering shell of a running container (Enter name)..."
			read -r CONTAINER
			docker exec -it "$CONTAINER" sh
			;;
		fixvolumes)
			echo "Fixing Fedora Docker volume permissions..."
			sudo chown -R "$USER:$USER" /var/lib/docker/volumes
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
			echo "Exiting without stopping Docker."
			exit 0
			;;
		*)
			echo "Unknown command. Available commands: down, restart, restart-service, rebuild, logs, status, shell, prune, fixvolumes, exit"
			;;
		esac
	done
fi

echo "⚡ No valid options provided. Use '-h' for help."
exit 1
