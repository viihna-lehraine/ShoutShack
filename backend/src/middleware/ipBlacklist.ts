import { inRange } from 'range_check';
import { Logger } from 'winston';
import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { __dirname } from '../config/loadEnv';
import setupLogger from '../config/logger';
import { getFeatureFlags } from '../config/featureFlags';

let blacklist: string[] = [];
const logger: Logger = setupLogger();
const featureFlags = getFeatureFlags();
const IP_BLACKLIST_ENABLED = featureFlags.enableIpBlacklistFlag;

// Initialize rangeCheck and load the blacklist
const initializeBlacklist = async (): Promise<void> => {
	if (IP_BLACKLIST_ENABLED) {
		logger.info('Ip Blacklist is enabled. Initializing blacklist');
		try {
			await loadBlacklist();
			logger.info(
				'Blacklist and range_check module loaded successfully.'
			);
		} catch (err) {
			logger.error('Error during blacklist initialization: ', err);
			throw err;
		}
	} else {
		logger.info('Ip Blacklist is disabled');
	}
};

// Load the blacklist from file
export const loadBlacklist = async (): Promise<void> => {
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
	if (IP_BLACKLIST_ENABLED) {
		logger.info('IP Blacklist is enabled. Adding IP to blacklist');
		if (!blacklist.includes(ip)) {
			blacklist.push(ip);
			saveBlacklist();
		} else {
			logger.info('IP already in blacklist');
		}
	} else {
		logger.info('IP Blacklist is disabled');
	}
};

// Save the blacklist
const saveBlacklist = async (): Promise<void> => {
	if (IP_BLACKLIST_ENABLED) {
		const filePath = path.join(__dirname, '../../data/blacklist.json');
		try {
			fs.writeFileSync(filePath, JSON.stringify(blacklist, undefined, 2));
		} catch (err) {
			console.error('Error saving blacklist: ', err);
		}
	}
};

// Middleware to check if the requester's IP is blacklisted
export const ipBlacklistMiddleware = (
	req: Request,
	res: Response,
	next: NextFunction
): void => {
	if (IP_BLACKLIST_ENABLED) {
		logger.info('IP Blacklist middleware enabled');
		const clientIp = req.ip;

		if (!clientIp) {
			console.error('Client IP undefined');
			res.status(500).json({ error: 'Bad request' });
			return;
		}

		if (blacklist.some(range => inRange(clientIp, range))) {
			console.log(`Blocked request from blacklisted IP: ${clientIp}`);
			res.status(403).json({ error: 'Access denied' });
			return;
		}
	} else {
		logger.info('IP Blacklist middleware disabled');
	}

	next();
};

// Remove an IP or range from the blacklist
export const removeFromBlacklist = (ip: string): void => {
	if (IP_BLACKLIST_ENABLED) {
		blacklist = blacklist.filter(range => range != ip);
		saveBlacklist();
	}
};

export const initializeIpBlacklist = initializeBlacklist;
