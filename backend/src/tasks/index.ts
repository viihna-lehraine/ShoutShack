// File: backend/src/tasks/index.ts

import { registerCronJob } from '../services/scheduler.js';
import { rotateLogs } from './logRotation.js';

registerCronJob('0 0 * * *', rotateLogs);

export const registerTasks = () => {
	console.log('Registering scheduled tasks...');
};
