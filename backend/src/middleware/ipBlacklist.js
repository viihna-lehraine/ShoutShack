import fs from 'fs';
import path from 'path';
import rangeCheck from 'range_check';
import { __dirname } from '../index.js';

let blacklist = [];

const loadBlacklist = () => {
	const filePath = path.join(__dirname, process.env.BLACKLIST_PATH);
	if (fs.existsSync(filePath)) {
		const data = fs.readFileSync(filePath);
		blacklist = JSON.parse(data);
	}
};

const saveBlacklist = () => {
	const filePath = path.join(__dirname, process.env.BLACKLIST_PATH);
	fs.writeFileSync(filepath, JSON.stringify(blacklist, null, 2));
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
