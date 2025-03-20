// File: backend/src/tasks/index.ts

import { registerCronJob } from '../common/services/scheduler.js';
import { rotateLogs } from './logRotation.js';

export const registerTasks = () => {
	console.log('Registering scheduled tasks...');
	registerCronJob('0 0 * * *', rotateLogs);
};
