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
    * Sass

* Server
    * Node.js 22.3.0
        * Express
	* TypeScript
	* Sequelize

* Database
    * PostgreSQL 16.3

* Secrets
	* HashiCorp Vault

* TypeScript and JavaScript globally adhere to ES2022 standards and ES Modules syntax. Frontend is strictly JS-free.

<br>

***

## 2. Goals

* 1. To give users a more interactive and customizable experience than 123guestbook provided while staying true to the spirit of the small web


    * I loved 123guestbook while I had one, but why not expand on what they did and what other guestbook services have done? I want more options and control for the users that want it, while maintaining simpler configurations for users that want more of a set-and-forget experience.


* 2. To respect the privacy and agency of users and the data they choose to share

    * I am a strong privacy advocate and want to create the sort of service I wish was the norm. I want to gather and store as little data as is possible for the service to function and for its developers to improve it over time. Under no circumstances will any tracking elements to be added. Third-party scripts, their functionalities, their authors, and why I've chosen to trust them will be explicitly disclosed to the user. No user data will be monetized for any reason whatsoever. Users from any place in the world will be able to export the complete set of data associated with their account as well as request its deletion.


* 3. To treat security as a top priority, with a strong focus on protecting users' data

    * At every stage of development and maintenance, a strong focus is to be placed on the application's security. Argon2id has been chosen for all hashing functionality with the application of user salts and a pepper which will be rotated on a regular basis, which will help encrypt user passwords at rest inside the database.
    
    * I plan to encrypt more data stored on the database at rest while keeping encryption keys stored offline in a secure manner. 


<br>

***

## 3. Client Functions

* Frontend is served from the **[public/](./frontend/public/)** directory, while frontend's Node initializaton is rooted in **[frontend/](./frontend/)** 

* The frontend is, at the moment, skeletal in design. I have done very little on that end, only creating the most rudimentary, non-working version of a registration and login page at this time. Current work is focused on creating a stable server that executes all its functions without performance or functionality-affecting bugs before pivoting to the frontend's implementation.

<br>

***

## 4. Server Functions

* Server initialization is defined in **[[app.js]](.backend/src/app.js)**

<br>

**DEV-NOTE** *finish writing*

***

## 5, State of the Project

<br> 

08/20/2024 - Backend and frontend have been completely converted from JavaScript to TypeScript, excluding a small number of JS files used in processes not intended for use in a production environment

09/25/2024 - As I've been coding the backend, I've had to refactor and redesign so many times that I've lost track at this point. Work is now focused on refactoring needed backend services into classes to maintain state, as well as refining the flow of the app initialization process. I'll be honest, I haven't touched the frontend code in weeks or longer at this point.


## 6. To Do

* write unit tests

* fine tune all DB models. check for redundancies and ensure they contain all necessary data

* make list of all sensitive user data (email address, 2FA credentials, etc) and make sure it is encrypted before transfer to database. encrypt this data with a robust mechanism, possibly involving keyfiles for MFA

* ensure models can accept but IPV4 and IPV6 address formats

* fine tune IP blacklist and VPN/proxy/TOR exit relay lists and the mechanism that will update them from
external sources; create functions allowing admin CRUD operations on these lists

* create secure backup mechanism for backend/data/

* add and configure hcaptcha

* define and configure API routes

* build user session functionality with JSON web tokens

* simulate user registration

* add subpages to dashboard.html
    * NEW SET OF TEMPLATES FOR WHEN USERS FINALIZE SETTINGS UPDATES
    * privacy
        * catch-all PRIVATE MODE which can be easily turned on or off
        * individual user data opt ins
            * several for user analytics
            * maybe offer a bit more storage for people who opt in
        * Y/N flag for indexing user guestbook page with search engines
        * show/hide creation date (default NO)
        * show/hide email (default NO)
        * export data
        * delete data
            * allow different output formats, including encrypted
    * settings
        * ON/OFF beta testing flag
        * email frequency and opt ins/outs
            * ON/OFF for new guestbook entry notification
            * ON/OFF for feature announcements
            * ON/OFF for bug fixes
            * ON/OFF for general announcements
        * length of time for session to stay valid (including indefinite session with use of user-approved cookie generation)
        * generate and use guestbook URL (no limits on frequency other than standard rate limiting)
        * custom guestbook word filters
        * blocklist CRUD operations
        * automatic "THANK YOU" email ON/OFF for entries that leave an email address
            * try to implement some kinda basic filtering
        * ON/OFF for "review new entries before adding to guestbook"
        * change guestbook status
            * active
            * read-only
        * custom user status
        * referral link
            * offer some kinda special icon or badge for their referrals' accumulated time spent on site or some such metric
	* security
	    * update username (once per month)
	    * update email
	    * update password
	    * enable/disable 2FA
	        * email
	        * TOTP
	        * Yubico OTP
	        * U2F/FIDO
	        * Passkey
	     * view backup codes (requires re-authenticating and will add an entry to the client-side security logs)
	     * regenerate backup codes
	     * preferred 2FA method
	     * review current 2FA methods
	     * security logs
	        * successful logins and associated IPs/user agents
	        * changes to security settings
	        * failed login attempts

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
