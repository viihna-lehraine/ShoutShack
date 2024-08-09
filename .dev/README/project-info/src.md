# Server Config

***

## Preamble

The goal of this README file is to document the structure and functionality of the Guestbook project's backend
<br>
<br>

***

## Navigation


1. #### [Structure](#1-Structure)
2. #### [Modules](#2-Modules)
<br>

***


## 1. Structure

#### src/ <div style="float: right;"><i>primary backend directory</i></div>
#### src/config/ <div style="float: right;"><i> config files for npm packages and secrets management</i></div>
#### src/controllers/ <div style="float: right;"><i>NOT YET IN USE</i></div>
#### src/middleware/ <div style="float: right;"><i>NOT YET IN USE</i></div>
#### src/models/ <div style="float: right;"><i>model definitions for database</i></div>
#### src/routes/ <div style="float: right;"><i>routing definitions (i.e. users, static, API)</i></div>
#### src/utils/ <div style="float: right;"><i>these files handle small, specific functions</i></div>
<br>
<br>

***

## 2. Modules

#### A. src/
1. #### server.js
    * 

#### B. src/config/
1. #### secrets.json.gpg
    * 
2. #### db.js
    * 
3. #### logger.js
    * 
4. #### passport.js
    * 
5. #### sops.js
    * 

#### C. src/conrollers/

#### D. src/middleware/

#### E. src/models/
1. #### GuestBookEntry.js
    * 
2. #### User.js
    * 

#### F. src/routes/
1. #### apiRoutes.js
    * 
2. #### staticRoutes.js
    * 
3. #### userRoutes.js
    * 

#### G. src/utils/
1. ####  email2FAUtil.js
    * 
2. #### totpUtil.js
    * 

#### H. src/utils/emailTemplates/
1. #### 2faEnabledEmailTemplate.js
    * 
2. #### accountDeletionStartedEmailTemplate.js
    * 
3. #### accountDeletedConfirmationTemplate.js
    * 
4. #### twoFactorEmailTemplate.js
    * 
    
<br>

***