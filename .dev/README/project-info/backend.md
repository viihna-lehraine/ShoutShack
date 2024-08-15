# Backend Config

***

<br>

The goal of this README file is to document the structure and functionality of the Guestbook project's backend Node server

<br>

***

## Navigation


1. #### [Structure](#1-Structure)
2. #### [Modules](#2-Modules)
<br>

***


## 1. Structure

#### backend/ <div style="float: right;"><i>project backend's root directory</i></div>
#### backend/src/ <div style="float: right;"><i>primary backend directory</i></div>
#### backend/src/config/ <div style="float: right;"><i> config files for npm packages and secrets management</i></div>
#### backend/src/controllers/ <div style="float: right;"><i>NOT YET IN USE</i></div>
#### backend/src/middleware/ <div style="float: right;"><i>NOT YET IN USE</i></div>
#### backend/src/models/ <div style="float: right;"><i>model definitions for database</i></div>
#### backend/src/routes/ <div style="float: right;"><i>routing definitions (i.e. users, static, API)</i></div>
#### backend/src/utils/ <div style="float: right;"><i>these files handle small, specific functions</i></div>
<br>
<br>

***

## 2. Modules

#### A. backend/

1. #### .dockerignore

    * Tells Docker which files to ignore when building the backend container

2. #### .nvmrc

    * Explicitly defines the backend's Node version

3. #### .prettierignore

    * Tells the Prettier style linter which files to ignore

4. #### .prettierrc

    * Configures Prettier and tells it how to style files across the backend

5. #### Dockerfile

    * Configurations for how to build and containerize the backend with Docker

6. #### backend.dev.env

    * Environment variables in the backend that aren't deemed a high priority in terms of security

        * BACKEND_LOG_EXPORT_PATH 

            * *path describing where log exports should be stored*

            * value format = string (file path)

        * FEATURE_API_ROUTES_CSRF 

            * *feature flag describing whether or not to use CSRF when setting and defining API Routes*

            * value format = boolean
            
        * FEATURE_DB_SYNC

            * *feature flag describing whether or not to sync with the external database*

            * value format = boolean

        * FEATURE_HTTP1

            * *feature flag describing whether or not to ONLY use the HTTP1 protocol*

            * value format = boolean

        * FEATURE_HTTP2

            * *feature flag describing whether or not to allow and prefer HTTP2 connection while still supporting HTTP1*

            * value format = boolean

        * FEATURE_HTTPS_REDIRECT

            * *feature flag describing whether or not to enforce the use of TLS for all connections*

            * value format = boolean

        * FEATURE_IP_BLACKLIST

            *feature flag describing whether or not to use the IP Blacklist functionality*

            * value format = boolean

        * FEATURE_LOAD_STATIC_ROUTES

            * *feature flag describing whether or not to load and utilize the backend's static routes*

            * value format = boolean

        * FEATURE_LOAD_TEST_ROUTES

            * *feature flag describing whether or not to load and utilize the backend's test routes*

            * value format = boolean

        * FEATURE_SECURE_HEADERS

            * *feature flag describing whether or not to load and set security headers as described in backend/src/config/securityHeaders.js*

            * value format = boolean

        * FRONTEND_APP_JS_PATH

            * *dfins the path for the frontend file app.js, which is the fronend's primary entry point*

            * value format = boolean

        * FRONTEND_BROWSER_CONFIG_XML_PATH

            * *defines the path for the frontend file browser-config.xml*

            * value format = string (file path)

        * FRONTEND_CSS_PATH

            * *defines the path for the frontend's css/ file directory*

            * value format = string (file path)

        * FRONTEND_FONTS_PATH
            
            * *defines the path describing the location of the frontend's fonts directories and files*

            * value format = string (file path)

        * FRONTEND_HUMANS_MD_PATH
            
            * *defines the path for the frontend file humans.md*

            * value format = string (file path)

        * FRONTEND_ICONS_PATH

            * *defines the path describing the location of the frontend's icon directories and files*

            * value format = string (file path)

        * FRONTEND_IMAGES_PATH

            * *defines the path describing the location of the frontend's image file directories and files*

            * value format = string (file path)

        * FRONTEND_JS_PATH

            * *defines the path describing the location of the frontend's JavaScript file directories and files*

            * value format = string (file path)

        * FRONTEND_KEYS_PATH

            * *defines the path describing the location of the frontend's public GPG key files*

            * value format = string (file path)

        * FRONTEND_LOGOS_PATH

            * *defines the path describing the location of the frontend's logo directories and files*

            * value format = string (file path)

        * FRONTEND_ROBOTS_TXT_PATH

            * *defines the path for the frontend file robots.txt*

            * value format = string (file path)

        * FRONTEND_SECURITY_MD_PATH

            * *defines the path for the frontend file security.md*

            * value format = string (file path)

        * FRONTEND_SECRETS_PATH

            * *defines the path for the frontend secrets file (secrets.json.gpg)*

            * value format = string (file path)

        * FRONTEND_SITEMAP_XML_PATH

            * *defines the path for the frontend file sitemap.xml*

            * value format = string (file path)

        * LOGGER

            * *describes how often the backend should schedule and complete log job defined in backend/src/utils/cron.js*

            * value format = number \(range [0-7])

        * NODE_ENV

            * *defines the backend Node environment as development, testing, or production*

            * value format = string { development, testing, production } 

        * EMAIL_USER

            * *the username from which nodemailer emails will be sent*

            * value format = string (email)

        * SERVER_LOG_PATH

            * *file path describing the location of the backend's main logfiles*

            * value format = string (file path)

        * SERVER_NPM_LOG_PATH

            * *file path describing the location of npm audit and npm update logfiles*

            * value format = string (file path) 

        * SERVER_PORT

            * *defines the port number used by the backend from which the frontend will be served*

            * value format = number (port number)

        * STATIC_ROOT_PATH

            * *defines the root path from which express.router() will define other static file paths*

            * value format = string (file path)
        
        * YUBICO_API_URL

            * *URL at which the Yubico API can be accessed*
            
            * value format: string (URL)*


7. #### eslint.config.js

    * configures the ESLint JavaScript linter

8. #### nodemon.json

    * configures the NPM tool Nodemon, which allows hot reloading

9. #### package-lock.json / package.json

    * Necessary Node configurations describing project metadata, scripts, startup behavior, and other features. Also lists all npm dependencies and their exact needed versions

#### B. backend/data/

1. #### blacklist.json
    
    * a list of all IP addresses and ranges that have been observed making harmful requests to the backend. IP addresses on this list will be, depending on behavior, rate-limited or banned for some length of time up to and including permanently

2. #### externalBlacklists.json

    * a list of IP addresses and ranges that have been observed by reputable 3rd-party sources to be guilty of repeated, malicious actions against other internet users and/or services

3. #### vpnIpLists.json

    * known IP address ranges of VPN services so that requests from these IP's can be treated as separate end users other than an unusual traffic pattern 

<br>

#### C. backend/keys/

1. #### keys/gpg/viihna*

    * Viihna Lehraine's GPG key set

2. #### keys/ssl/

    * GPG-encrypted SSL keys

<br>

#### D. backend/logs/

* backend log files split into npm/, server/ (main logs directory), and test/

<br>

#### E. backend/src/

1. #### server.js

    * the backend primary entry point which initializes the backend NodeJS server

2. #### index.js

    * central import and export point for the backend server

<br>

#### F. backend/src/config/

1. #### secrets.json.gpg

    * Sensitive environment variables, encrypted as per `sops.js` and read on-the-fly using the Mozilla SOPS CLI secrets management tool.

    * Variables defined in this file include:

        * APP_SSL_KEY
            1. *path to the backend SSL key*
            2. value format: string (file path)

        * APP_SSL_CERT
            1. *path to the backend's certificate*
            2. value format: string (file path)

        * DB_SSL_KEY
            1. *path to the database's SSL key*
            2. value format: string (file path)

        * DB_SSL_CERT
            1. *path to the database's SSL cert*
            2. value format: string (file path)

        * DB_NAME
            1. *name of the database*
            2. value format: string

        * DB_USER
            1. *database user chosen to interact with the database on behalf of the backend*
            2. value format: string

        * DB_PASSWORD
            1. *database user's password*
            2. value format: string

        * DB_HOST
            1. *hostname/IP address of the database*
            2. value format: string

        * EMAIL_2FA_KEY
            1. *key used by the backend for generating 2FA codes to users' emails as a 2FA method*
            2. Value format: string (cryptographically secure and randomized 32-bit hexadecimal value)

        * *EMAIL_HOST
            1. *email host to be used by nodemailer*
            2. value format: string

        * EMAIL_PORT
            1. *port number to be used by nodemailer for connecting to its external email service*
            2. value format: number

        * EMAIL_SECURE
            1. *indicates whether nodemailer will connect to the email service using SSL/TLS immediately. Some email hosts secure connections by default when using a specific port, in which case this value should be set to 'false'.*
            2. value format: boolean

        * FIDO_CRYPTO_PARAMETERS
            
            1. *defines supported cryptographic algorithms for use within the FIDO2 authentication schema*
            
            2. value format: string (array)

        * FIDO_AUTHENTICATOR_REQUIRE_RESIDENT_KEY

            1. *configures whether or not the user's FIDO2/U2F key must create a resident key stored on the device itself*

            2. value format: boolean

        * FIDO_AUTHENTICATOR_USER_VERIFICATION

            1. *dictates how the FIDO2/U2F device should handle user verification during the authentication process (typically involves the user proving their identity to the authenticator, such as biometrics (e.g. fingerprint, face ID) or a PIN)*

                * possible values include...

                    * 1a. "required" - the authenticator must perform user verification. The user will be prompted to verify themselves whenever they use the key

                    * 1b. "preferred" - user verification is preferred but not mandatory. If the authenticator supports it, the user will be prompted to verify themselves. Otherwise, authentication will proceed without verification

                    * 1c. "discouraged" - the authenticator should not perform user verification. The process will rely on server-side factors for verification, like other 2nd-factor schemas 

            2. value format = string ({ required, preferred, discouraged })

        * JWT_SECRET
            1. *secret value used by the backend for generating cryptographically secure JSON Web Tokens*
            2. value format: string (cryptographically secure and randomized 64-bit hexadecimal value)

        * PEPPER
            1. *additional factor added to all user passwords before argon2id hashing, making the hashes more unique and harder to crack*
            2. value format: string (cryptographically secure and randomized 32-bit hexadecimal value)

        * SMTP_TOKEN
            1. *SMTP token provided by the email service, used for authenticating admin credentials with nodemailer*
            2. value format: string

        * YUBICO_CLIENT_ID
            1. *credential assigned to the admin based on their specific Yubikey*
            2. value format: number

        * YUBICO_SECRET_KEY
            1. *credential assigned to the admin's specific Yubikey when initially requesting Yubico Client ID*
            2. value format: string 


2. #### db.js

    * responsible for setting up and initializing a connection to the database using the Sequelize ORM library, as well as integrating logging and secret management into the database connection process

3. #### featureFlags.js

    * loads environment variables and converts them into boolean values which control feature flags at various places in the backend using imports from loadEnv.js and parseBoolean.js

4. #### loadEnv.js

    * loads non-sensitive environment variables from backend.dev.env for use in other parts of the backend

5. #### logger.js

    * establishes a logging system using the Winston library. Configures a logger than writes logs to the console as well as rotating log files
    
    * creates different formats for production and development environments
    
    * the 'DailyRotateFile' transport ensures that log files are rotated daily, compressed, and stored for a specified duration

6. #### mailer.js

    * creates and manages an email transported using the 'nodemailer' library

    * the 'createTransporter' function initializes the transportee with SMTP settings including host, port, security options, and authentication

    * the 'getTransporter' function ensures taht a single transporter instance is reused across the application, creating it only when necessary

7. #### passport.js

    * configures authentication strategies using the 'passport' library

    * sets up both JWT and local authentication strategies
    
    *  the JWT strategy validates tokens extracted from the 'Authorization' header and verifies the user's identity using the JWT secret environment variable

    * the local strategy handles traditional username/password authentication and checks the credentials against the database 

8. #### secrets,js

    * securely retrieves and decrypts secrets stored in /backend/src/config/secrets.json.gpg using Mozilla SOPS

9. #### securityHeaders.js

    * leveraging the 'helmet' library, configures and sets up various security headers for the backend application to enhance its security posture

    * configuration specifies frameguard, DNS prefetch control, the X-Powered-By header, enforces HSTS, disables MIME sniffing, and enables XSS protection

    * configures the CSP to control the allowed sources of scripts, styles, images, and connections, only allowing explicitly trusted sources

    * enforces Certificate Transparency and configures a Permisions Policy to restrict access to features like geolocation, microphone, camera, and payment requests 

10. #### sops.js

    * leverages Mozilla SOPS to decrypt and read secrets.json.gpg, as well as the GPG-encrypted SSL key/certificate files used by the backend  

<br>

#### G. backend/src/conrollers/

1. #### guestbookController.js

    * defines 4  API route handlers for managing guestbook entries in the backend Express.js application. Together, they perform CRUD operations

<br>

#### H. backend/src/middleware/

1. #### auth.js
    
    * defines an authentication middleware function for the backend using Passport

    * the authentication functon uses the JWT strategy configured in passpot.js to authenticate incoming requests

2. #### ipBlacklist.js

    * interacts with and manages the IP Blacklist, which is currently used to block requests from specific IP addresses or ranges

    * includes functionality for loading, adding, removing, and checking against the blacklist

    * uses the 'range_check' module to handle IP range checking

3. #### rateLimit.js

    * sets up rate-limiting behavior using the 'express-rate-limit' middleware

    * needs to be fine-tuned and expanded upon

4. #### validate.js

    * used for validating input data received by the backend using the 'express-validator' library

    * enforces validation rules to protect the backend server and to deny user input that may cause unexpected or unwanted behavior

<br>

#### I. backend/src/models/

1. #### GuestbookEntry.js

    * defines a Sequelize model for guestbook entries

    * this model represents the structure of the GuestbookEntry table in the database and handles interaction with the database in regards to data that uses or is meant for inclusion using this table

2. #### User.js

    * defines a Sequelize model for registered users' account data

    * this model represents the structure of the User table in the database and handles interaction with the database in regards to data that is meant for inclusion using this table

    * handles user authentication, password management, and other account-specific data 

<br>

#### J. backend/src/routes/

1. #### apiRoutes.js

    * organizes and mounts different API routes

2. #### staticRoutes.js

    * sets up and serves certain static files and file types (including HTML, CSS, JavaScript, images, fonts, icons, and other speciic files)

3. #### testRoutes.js

    * defines a very simple Express.js route used for testing purposes

4. #### userRoutes.js

    * defines various routes used for handling user-related operations including registration, login, password recovery, and two-factor authentication

5. #### validationRoutes.js

* defines a route for handling user registration using input validation defined in backend/src/middleware/validate.js

<br>

#### I. backend/src/utils/

1. ####  cron.js

    * responsible for automating and scheduling various tasks for the backend using the 'node-cron' library

    * The following jobs are currently configured...

        * 1a. Log compression and export

        * 1b. Npm audits and updates

        * 1c. Log scheduling (with various options, activated via environment variable)

2. #### debug.js

    * sets up abnd manages debug logs using the 'debug' library

3. #### helpers.js

    * contains various exported helper functions which are imported by other files across the backend

    * The following helper functions are currently defined and exported...

        * 1a. loadTestRoutes - self-explanatory

4. #### parseBoolean.js

    * contains a function created for parsing the strings 'true' / 'false' and converting them to their corresponding boolean values

<br>

#### J. backend/src/utils/auth/

1. #### backupCodeUtils.js

    * provides utility functions for generating backup codes when 2FA is enabled on the user's account

    * also provides functions for removing used backup codes, validating backup codes, and updating necessary information on the user's User model within the database

2. #### email2FAUtil.js

    * provides utility functions for generating and verifying two-factor authentication codes sent via email

3. #### fido2Util.js

    * provides utility functions for letttng users create and store 2FA credentials in their own FIDO2/U2F keys and compatible devices

4. #### passkeyUtil.js

    * provides utility functions for letting users create and use passkeys for both 2FA as well as full login

5. #### totpUtil.js

    * provides utility functions for generating and verifying TOTPs (time-based-one-time-passwords)

6. #### yubicoOtp.js

    * provides utility functions for allowing users to use the Yubico OTP functionality on their Yubikeys as a 2nd factor for authentication

<br>

#### K. backend/src/utils/templates/email/

1. #### 2FactorEmailTemplate.js

    * generates an HTML email template for sending a two-factor authentication code to a user

2. #### 2FAEnabledEmailTemplate.js

    * generates an HTML email template which notifies a user when two-factor authentication has been enabled on their account

3. #### accountDeletedConfirmationEmailTemplate.js

    * generates an HTML email template that notifies the user their account has been deleted

4. #### accountDeletionStartedEmailTeplate.js

    * generates an HTML email template which notifies the user that the timed process of deleting their account has begun 

5. #### confirmationEmailTemplate.js
    
    * generates an HTML email template sent to the user upon successfull account registration, containing an email verification link which, when clicked, will complete the usr's account verification

<br>

***