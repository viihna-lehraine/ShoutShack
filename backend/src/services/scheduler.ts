// File: backend/src/services/scheduler.ts

import { CronJob } from '../types/index.js';
import cron from 'node-cron';

const cronJobs: CronJob[] = [];

export const registerCronJob = (schedule: string, task: () => Promise<void> | void) => {
	cronJobs.push({ schedule, task });
};

export const startCronJobs = () => {
	for (const { schedule, task } of cronJobs) {
		cron.schedule(schedule, async () => {
			try {
				console.log(`Running scheduled task (${schedule})...`);

				await task();

				console.log(`Task completed successfully (${schedule})`);
			} catch (err) {
				console.error(`Scheduled task failed (${schedule}):`, err);
			}
		});
	}
	console.log('Cron Scheduler Initialized');
};
