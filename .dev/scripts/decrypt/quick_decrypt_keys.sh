#!/bin/sh


cd /home/viihna/viihnaFolders/computerWork/projects/guestbook/.keys/ssl/

sops -d app.crt.gpg > app.crt
sops -d app.csr.gpg > app.csr
sops -d app.key.gpg > app.key

rm app.crt.gpg
rm app.csr.gpg
rm app.key.gpg