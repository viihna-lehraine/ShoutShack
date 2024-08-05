// Guestbook - version 0.0.0 (initial development)
// Licensed under GNU GPLv3 (https://www.gnu.org/licenses/gpl-3.0.html)
// Author: Viihna Lehraine (viihna@voidfucker.com || viihna.78 (Signal) || Viihna-Lehraine (Github))



const express = require('express');
const userRoutes = require('./userRoutes');

const router = express.Router();


// Mount the user routes at /users
router.use('/users', userRoutes);


module.exports = router;