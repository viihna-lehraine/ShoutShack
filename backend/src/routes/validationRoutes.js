import express from 'express';
import validationResult from 'express-validator';
import { registrationValidationRules } from '../middleware/validate';

const router = express.Router();

router.post('/register', registrationValidationRules, async (req, res) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}
});

export default router;
