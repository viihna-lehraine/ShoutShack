# Guestbook Contribution Guide

<br>

Contributions are more than welcome! All that I ask is that you respect the goals and vision of the project itself and follow a few simple rules.

<br>

***

### Workflow
***

#### <b>Please ensure consistency with the existing syntax and format of the project</b>

1. Node files should be written using ES Module syntax
    
2. JavaScript files should be written using vanilla JS

3. ESLint, Prettier, and .editorconfig are used for code styling and linting. Please see the following files and follow their guidelines 

    * [eslint.config.js](../../../eslint.config.js)

    * [.prettierrc](../../../.prettierrc)

    * [.editorconfig](../../../.editorconfig)

4. CSS should be compiled from the Sass files in frontend/public/scss/. Sass should watch the public/ directory*. 
    * *(see scripts in [package.json](../../../package.json))* 

5. Please do not add new frameworks without consulting the team

6. If you find security vulnerabilities, please alert Viihna Lehraine as soon as possible with as much detail as possible.