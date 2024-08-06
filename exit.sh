#!/bin/bash


tar -czvf logs.tar.gz logs

gpg --output logs.tar.gz.gpg -r B5BC332A603B022E21E46F2DA18BAE412BC0A77C --encrypt logs.tar.gz

rmdir --ignore-fail-on-non-empty logs && rm logs.tar.gz