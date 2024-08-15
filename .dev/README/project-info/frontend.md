# Frontend Config

***

<br>

This file documents the structure and functionality of the Guestbook project's [public/](../../public/) directory

<br>

***

## Navigation

<br>

#### A. [Structure](#A-structure)

#### B. [Modules](#B-modules)
<br>

***


## A. Structure

<br>

#### public/ <div style="float: right; font-weight: normal"><i>primary frontend directory</i></div>

<br>

#### public/assets/ <div style="float: right; font-weight: normal"><i>fonts, media files, favicons, etc.</i></div>

<br>

#### public/css/ <div style="float: right; font-weight: normal"><i>holds Sass-compiled stylings for whole frontend</i></div>

<br>

#### public/dashboard/ <div style="float: right; font-weight: normal"><i>holds sub-pages for client's dashboard.html</i></div>

<br>

#### public/guestbook/ <div style="float: right; font-weight: normal"><i>holds all client guestbook pages</div>
#### <div style="float: right; font-weight: normal"><i> https://[DOMAIN]/guestbook/[USERNAME].html</i></div>

<br>
<br>

#### public/js/ <div style="float: right; font-weight: normal"><i>all JS files except exports.js or index.js</i></div>

<br>

#### public/scss/ <div style="float: right; font-weight: normal"><i>scss pages</i></div>

<br>

***

## B. Modules

### 1. public/

* 1-A. confirm.html

    * this page appears after successfully submitting a registration request from regsiter.html and informs them they have been sent an account confirmation request at their email address

* 1-B. dashboard.html

    * this is a landing page for the user's dashboard containing all account-specific settings, configurations, and actions

* 1-C. faq.html

    * page with answers to predicted common questions and questions that prove to be common among users

* 1-D. index.html

    * currently serves as a sitemap linking to all web pages

* 1-E. password-reset.html

    * page provides the functionality for and explains how to reset one's password (reachable while logged out)
 
* 1-F. register.html

    * contains the account registration form

* 1-G. resources.html

    * describes several beginner-friendly resources for learning HTML and CSS, allowing the user to more fully utilize the customization option

* 1-H. security-policy

    * informs users how their data is protected, what security practices the project follows, and how to responsibly report vulnerabilities

    * IMPORTANT - keep a usable changelog of significant updates or changes to this page.

* 1-I. tos.html

    * terms of service - details of agreement between Guestbook and its clients

* 1-J app.js

    * entry point for all frontend JavaScript

* 1-K humans.md

    * credits for the project's creators and maintainers

* 1-L security.md

    * contains a simplified outline for how to responsibly report a security vulnerability

* 1-M robots.txt

    * tells web crawlers what assets and pages to index and what not to index 

* 1-N sitemap.xml

    * helps web crawlers index pages and defined date of last modification and relative page priority for all web pages

<br>

### 2. public/assets

* This folder contains all static assets, such as fonts, icons, images, audio, video, GIFs, etc.

<br>

### 3. public/css/

* 3-A main.css

    * unified CSS page compiled by Sass 

* 3-B. main.css.map
    
    * CSS mapping file for unified CSS compiled by Sass

<br>

### 4. public/guestbook/

* 4-A *.html

    * contains the user-generated Guestbook page. whole page or most of page will exist inside a form, which the user submits to the backend in order to update their page

<br>

### 5. public/js/

* 5-A index.js
    
    * central import/export page for all JS files to use

<br>

### 7. public/js/modules/ 

* JS files which work as modules, having the ability to be added aned remvoed in a customizable manner

<br> 

### 8. public/js/pages/

* individual JS files with specific behavior tied to a single web page

<br>

### 9. public/js/utils/
* 9-A utils.js
    
    * contains utility functions exported for use by other page-specific JS files

<br>

### 10. public/scss/
* 10-A {HTML}.scss

    * page-specific styles

* 10-B _global.scss
    
    * style rules that apply to all web pages

* 10-C _keyframes.scss
    
    * keyframe definitions and rules

* 10-D _variables.scss
    
    * contains all Sass-defined variables

* 10-E main.scss

    * tells Sass which .scss files to import and use when compiling main.css

<br>

***