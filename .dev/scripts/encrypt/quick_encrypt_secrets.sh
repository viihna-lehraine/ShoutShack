#!/bin/sh

cd /home/viihna/viihnaFolders/computerWork/projects/guestbook/backend/config/

sops -e -pgp B6D74DFDBF2028F9B3E77527F2383D42EEF34F9F secrets.json > secrets.json.gpg
