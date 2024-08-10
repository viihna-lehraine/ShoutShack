import fs from 'fs';
import path from 'path';
import { __dirname } from '../index.js';

let blacklist = [];
let rangeCheck;

// Dynamically import rangeCheck as a CommonJS module
(async () => {
	rangeCheck = (await import('range_check')).default;
})();

export const loadBlacklist = async () => {
	const filePath = path.join(__dirname, '../../data/blacklist.json');
	if (fs.existsSync(filePath)) {
		const data = fs.readFileSync(filePath);
		blacklist = JSON.parse(data);
	}
};

const saveBlacklist = () => {
	const filePath = path.join(__dirname, '../../data/blacklist.json');
	fs.writeFileSync(filePath, JSON.stringify(blacklist, null, 2));
};

// Middleware to check if the requester's IP is blacklisted
export const ipBlacklistMiddleware = (req, res, next) => {
	const clientIp = req.ip;

	if (blacklist.some((range) => rangeCheck.inRange(clientIp, range))) {
		console.log(`Blocked request from blacklisted IP: ${clientIp}`);
		return res.status(403).json({ error: 'Access denied' });
	}

	next();
};

// Add an IP or range to the blacklit
export const addToBlacklist = (ip) => {
	if (!blacklist.includes(ip)) {
		blacklist.push(ip);
		saveBlacklist();
	}
};

// Remove an IP or range from the blacklist
export const removeFromBlacklist = (ip) => {
	blacklist = blacklist.filter((range) => range != ip);
	saveBlacklist();
};

loadBlacklist();