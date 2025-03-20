#!/bin/bash

set -e

read -rsp "Enter admin password: " password
echo

salt=$(head -c 16 /dev/urandom | base64)

hash=$(echo -n "$password" | argon2 "$salt" -id -m 102 -t 8 -p 8)

echo "$salt:$hash" | sudo tee /etc/shoutshack/admin.pw >/dev/null
sudo chmod 600 /etc/shoutshack/admin.pw

echo "Password salted and hashed successfully."
