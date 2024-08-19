import express, { Request, Response, NextFunction } from 'express';
import validationResult from 'express-validator';
import { registrationValidationRules } from '../middleware/validator.js';

const router = express.Router();

router.post('/register', registrationValidationRules, async (rreq: Request, res: Response, next: NextFunction) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}

	return next;
});

export default router;
