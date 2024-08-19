import rangeCheck from 'range_check';
import { Logger } from 'winston';
import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { __dirname } from '../config/loadEnv.js';
import setupLogger from '../middleware/logger.js';

type RangeCheckType = {
	inRange: (ip: string, range: string) => boolean;
};

let blacklist: string[] = [];
let logger: Logger;
let rangeCheckModule: RangeCheckType | undefined;

// Initialize rangeCheck and load the blacklist
const initializeBlacklist = async (): Promise<void> => {
	logger = await setupLogger();
	try {
		if (!rangeCheckModule) {
			rangeCheckModule = rangeCheck;
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
export const loadBlacklist = async (): Promise<void> => {
	const logger = await setupLogger();
	const filePath = path.join(__dirname, '../../data/blacklist.json');
	try {
		if (fs.existsSync(filePath)) {
			const data = fs.readFileSync(filePath, 'utf8');
			blacklist = JSON.parse(data);
		}
	} catch (err) {
		logger.error('Error loading blacklist: ', err);
		blacklist = []; // default to empty array in case of failure
	}
};

// Add an IP or range to the blacklist
export const addToBlacklist = (ip: string): void => {
	if (!blacklist.includes(ip)) {
		blacklist.push(ip);
		saveBlacklist();
	}
};

// Save the blacklist
const saveBlacklist = async (): Promise<void> => {
	const filePath = path.join(__dirname, '../../data/blacklist.json');
	try {
		fs.writeFileSync(filePath, JSON.stringify(blacklist, null, 2));
	} catch (err) {
		console.error('Error saving blacklist: ', err);
	}
};

// Middleware to check if the requester's IP is blacklisted
export const ipBlacklistMiddleware = (req: Request, res: Response, next: NextFunction) => {
	if (!rangeCheck) {
		console.error('rangeCheck module is not loaded');
		return res.status(500).json({ error: 'Server error' });
	}

	const clientIp = req.ip;

	if (!clientIp) {
		console.error('Client IP undefined');
		return res.status(500).json({ error: 'Bad request' });
	}

	if (blacklist.some((range) => rangeCheck!.inRange(clientIp, range))) {
		console.log(`Blocked request from blacklisted IP: ${clientIp}`);
		return res.status(403).json({ error: 'Access denied' });
	}

	return next();
};

// Remove an IP or range from the blacklist
export const removeFromBlacklist = (ip: string): void => {
	blacklist = blacklist.filter((range) => range != ip);
	saveBlacklist();
};

export const initializeIpBlacklist = initializeBlacklist;
