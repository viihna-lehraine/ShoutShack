const express = require('express');
const userRoutes = require('./userRoutes');

const router = express.Router();


// Mount the user routes at /users
router.use('/users', userRoutes);


module.exports = router;