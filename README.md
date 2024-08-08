# Guestbook Project

## Content
* ### [Introduction](#1-introduction)
* ### [Goals](#2-goals)
* ### [Client Functions](#3-client-functions)
* ### [Server Functions](#4-goals)
* ### [State of the Project](#5-state-of-the-project)
* ### [To Do](#6-to-do)
* ### [Authors](#7.-authors)

<br>

***

## 1. Introduction

This is a full stack project with the goal of creating a web app allowing users to create custom guestbook pages. In June 2024 123guestbook.com closed down their service for good. Many of us on Neocities used that service and had grown fond of it. I've been unable to find a suitable alternative, so I decided to design and deploy one myself.

<br>

The project stack includes the following

<br>

* Frontend
    * HTML5
    * CSS3
    * JavaScript
    * Sass 1.77.8 *(compiled with dart2js 3.4.4)*

* Server
    * Node.js 22.3.0
        * Express

* Database
    * PostgreSQL 16.3
        * Sequelize

<br>

***

## 2. Goals

* 1. To give users a more interactive and customizable experience than 123guestbook provided while staying true to the spirit of the small web


    * I loved 123guestbook while I had one, but why not expand on what they did and what other guestbook services have done? I want more options and control for the users that want it, while maintaining simpler configurations for users that want more of a set-and-forget experience.


* 2. To respect the privacy and agency of users and the data they choose to share

    * I am a strong privacy advocate and want to create the sort of service I wish was the norm. I want to gather and store as little data as is possible for the service to function and for its developers to improve it over time. Under no circumstances will any tracking elements to be added. Third-party scripts, their functionalities, their authors, and why I've chosen to trust them will be explicitly disclosed to the user. No user data will be monetized for any reason whatsoever. Users from any place in the world will be able to export the complete set of data associated with their account as well as request its deletion.


* 3. To treat security as a top priority, with a strong focus on protecting users' data

    * At every stage of development and maintenance, a strong focus is to be placed on the application's security. Argon2id has been chosen for all hashing functionality with the application of user salts and a pepper which will be rotated on a regular basis, which will help encrypt user passwords at rest inside the database.
    
    I still plan to encrypt more data stored on the database at rest while keeping their encryption keys stored offline. More 


<br>

***

## 3. Client Functions

* Frontend is served from the **[[/public]](/public)** directory 

* The frontend is, at the moment, skeletal in design. I have done very little on that end, only creating the most rudimentary, non-working version of a registration and login page at this time. Current work is focused on creating a stable server that executes all its functions without performance or functionality-affecting bugs before pivoting to the frontend's implementation.

<br>

***

## 4. Server Functions

* Server initialization is defined in **[[server.js]](.src/config.server.js)**

<br>

**DEV-NOTE** *finish writing*

***

## 5, State of the Project

<br> 

**DEV-NOTE** *add this*

## 6. To Do

* More robust logging

* Stable npm start

<br>

***

**DEV-NOTE** *add to this*

***

## 7. Authors

* ### **Viihna Lehraine**
    
    * **_Developer and Initial Author_**


    * **_[viihna@ViihnaTech.com](mailto:viihna@viihnatech.com)_**

    * GPG - *[[Email Key]](.keys/gpg/viihna@viihnatech.com_email_key.asc)* || *[[Encryption Key]](.keys/gpg/viihna@viihnatech.com_encryption_key.asc)* || *[[Signing Key]](.keys/gpg/viihna@viihnatech.com_signing_key.asc)*



<br>

***