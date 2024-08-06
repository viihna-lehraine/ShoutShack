#!/bin/bash


gpg --output logs.tar.gz --decrypt logs.tar.gz.gpg

tar -xvzf logs.tar.gz

rm logs.tar.gz.gpg && rm logs.tar.gz