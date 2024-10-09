#!/bin/sh


cd /home/viihna/viihnaFolders/computerWork/projects/ShoutShack/src/config/

sops -d --output-type json secrets.json.gpg > secrets.json

sops -d guestbook_cert.pem.gpg > guestbook_cert.pem && sops -d guestbook_key.pem.gpg > guestbook_key.pem

rm secrets.json.gpg
