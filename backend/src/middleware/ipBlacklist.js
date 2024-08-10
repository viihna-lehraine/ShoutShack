import fs from 'fs';
import path from 'path';
import { __dirname, setupLogger } from '../index.js';

let blacklist = [];
let rangeCheck;
let logger;

// Initialize rangeCheck and load the blacklist
const initializeBlacklist = async () => {
	logger = await setupLogger();
	try {
		if (!rangeCheck) {
			rangeCheck = (await import('range_check')).default;
			logger.info('rangeCheck module loaded successfully');
		}
		await loadBlacklist();
		logger.info('Blacklist and range_check module loaded successfully.');
	} catch (err) {
		logger.error('Error during blacklist initialization: ', err);
		throw err;
	}
};

// Load the blacklist from file
export const loadBlacklist = async () => {
	const logger = await setupLogger();
	const filePath = path.join(__dirname, '../../data/blacklist.json');
	try {
		if (fs.existsSync(filePath)) {
			const data = fs.readFileSync(filePath, 'utf8');
			blacklist = JSON.parse(data);
		}
	} catch (err) {
		logger.error('Error loading blacklist: ', err);
		blacklist = []; // default to empty blacklist array in case of failure
	}
};

// Add an IP or range to the blacklit
export const addToBlacklist = (ip) => {
	if (!blacklist.includes(ip)) {
		blacklist.push(ip);
		saveBlacklist();
	}
};

// Save the blacklist
const saveBlacklist = async () => {
	const filePath = path.join(__dirname, '../../data/blacklist.json');
	try {
		fs.writeFileSync(filePath, JSON.stringify(blacklist, null, 2));
	} catch (err) {
		console.error('Error saving blacklist: ', err);
	}
};

// Middleware to check if the requester's IP is blacklisted
export const ipBlacklistMiddleware = (req, res, next) => {
	if (!rangeCheck) {
		console.error('rangeCheck module is not loaded');
		return res.status(500).json({ error: 'Server error' });
	}

	const clientIp = req.ip;

	if (blacklist.some((range) => rangeCheck.inRange(clientIp, range))) {
		console.log(`Blocked request from blacklisted IP: ${clientIp}`);
		return res.status(403).json({ error: 'Access denied' });
	}

	next();
};

// Remove an IP or range from the blacklist
export const removeFromBlacklist = (ip) => {
	blacklist = blacklist.filter((range) => range != ip);
	saveBlacklist();
};

export const initializeIPBlacklist = initializeBlacklist;