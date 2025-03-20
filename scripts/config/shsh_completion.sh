#!/bin/bash

_shsh_completions() {
	local cur prev opts containers
	COMPREPLY=()
	cur="${COMP_WORDS[COMP_CWORD]}"
	prev="${COMP_WORDS[COMP_CWORD - 1]}"

	opts="down restart restart-service rebuild logs status shell prune exit help -b -B -d -u -U -p -h"

	# Get running container names safely
	if containers=$(docker ps --format "{{.Names}}" 2>/dev/null); then
		mapfile -t containers <<<"$containers"
	else
		containers=()
	fi

	case "$prev" in
	restart-service | rebuild | logs | shell)
		mapfile -t COMPREPLY < <(compgen -W "${containers[*]}" -- "$cur")
		return
		;;
	esac

	mapfile -t COMPREPLY < <(compgen -W "$opts" -- "$cur")
}

complete -F _shsh_completions ShSh
