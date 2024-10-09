const { randomBytes } = require('crypto');
const sessionSecret = randomBytes(64).toString('hex');
console.log(sessionSecret);
