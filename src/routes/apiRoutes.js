import express from 'express';
import userRoutes from './userRoutes';

const router = express.Router();

// Mount the user routes at /users
router.use('/users', userRoutes);

export default router;