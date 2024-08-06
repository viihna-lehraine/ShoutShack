#!/bin/bash


######################################

gpg --output .keys.tar.gz --decrypt .keys.tar.gz.gpg

gpg --output logs.tar.gz --decrypt logs.tar.gz.gpg

######################################

tar -xvzf .keys.tar.gz

tar -xvzf logs.tar.gz

######################################

rm .keys.tar.gz.gpg && rm .keys.tar.gz

rm logs.tar.gz.gpg && rm logs.tar.gz