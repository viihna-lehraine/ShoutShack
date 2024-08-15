# Nginx Config
***

<br>

This file documents the structure and functionality of files and directories located in the Guestbook project's Nginx directory

The Nginx server is configured as a reverse-proxy for the Guestbook project

<br>

***

## Navigation


1. #### [Structure](#1-Structure)
2. #### [Files and Directories](#2-Files-and-Directories)
    * [nginx/](#A-nginx)
    * [nginx/conf.d/](#B-conf.d)
    * [nginx/logs/](#C-logs/)
    * [nginx/ssl/](#D-ssl/)

<br>

***

## 1. Structure

#### nginx/ <div style="float: right;"><i>Nginx server's root directory</i></div>
#### nginx/conf.d/ <div style="float: right;"><i>Application-specific Nginx server configurations</i></div>
#### nginx/logs/ <div style="float: right;"><i>Nginx-specific logfiles</i></div>
#### nginx/ssl/ <div style="float: right;"><i>Holds the GPG-encrypted SSL key and certificate files for the Nginx server</i></div>

<br>

***

## 2. Files and Directories

### A. nginx/

    1. #### Dockerfile

        * simple Dockerfile used to create a Docker image for the Nginx server

    2. #### nginx.conf

        * base configuration file for the Nginx server

    3. #### mime.types

        * an Nginx configuration file which maps file extensions to MIME types, which helps the server determine the appropriate 'Content-Type' header for serving files to clients

### B. nginx/conf.d/

    1. #### guestbook.conf

        * defines application-specific behavior and routes for the Nginx server

### C. nginx/logs/

    1. #### (all)

        * log files containing information used for debugging and maintaining the Nginx server

### D. nginx/ssl/

    1. #### (all)

        * paths to the GPG-encrypted SSL key and certificate files used by the Nginx server

<br>

***