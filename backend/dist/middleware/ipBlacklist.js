import { inRange } from 'range_check';
import fs from 'fs';
import path from 'path';
import { __dirname } from '../config/loadEnv.js';
import setupLogger from '../config/logger.js';
let blacklist = [];
let logger;
// Initialize rangeCheck and load the blacklist
const initializeBlacklist = async () => {
	logger = await setupLogger();
	try {
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
		blacklist = []; // default to empty array in case of failure
	}
};
// Add an IP or range to the blacklist
export const addToBlacklist = ip => {
	if (!blacklist.includes(ip)) {
		blacklist.push(ip);
		saveBlacklist();
	}
};
// Save the blacklist
const saveBlacklist = async () => {
	const filePath = path.join(__dirname, '../../data/blacklist.json');
	try {
		fs.writeFileSync(filePath, JSON.stringify(blacklist, undefined, 2));
	} catch (err) {
		console.error('Error saving blacklist: ', err);
	}
};
// Middleware to check if the requester's IP is blacklisted
export const ipBlacklistMiddleware = (req, res, next) => {
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
	next();
};
// Remove an IP or range from the blacklist
export const removeFromBlacklist = ip => {
	blacklist = blacklist.filter(range => range != ip);
	saveBlacklist();
};
export const initializeIpBlacklist = initializeBlacklist;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXBCbGFja2xpc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbWlkZGxld2FyZS9pcEJsYWNrbGlzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsT0FBTyxFQUFFLE1BQU0sYUFBYSxDQUFDO0FBR3RDLE9BQU8sRUFBRSxNQUFNLElBQUksQ0FBQztBQUNwQixPQUFPLElBQUksTUFBTSxNQUFNLENBQUM7QUFDeEIsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLG1CQUFtQixDQUFDO0FBQzlDLE9BQU8sV0FBVyxNQUFNLGtCQUFrQixDQUFDO0FBRTNDLElBQUksU0FBUyxHQUFhLEVBQUUsQ0FBQztBQUM3QixJQUFJLE1BQWMsQ0FBQztBQUVuQiwrQ0FBK0M7QUFDL0MsTUFBTSxtQkFBbUIsR0FBRyxLQUFLLElBQW1CLEVBQUU7SUFDckQsTUFBTSxHQUFHLE1BQU0sV0FBVyxFQUFFLENBQUM7SUFDN0IsSUFBSSxDQUFDO1FBQ0osTUFBTSxhQUFhLEVBQUUsQ0FBQztRQUN0QixNQUFNLENBQUMsSUFBSSxDQUFDLHVEQUF1RCxDQUFDLENBQUM7SUFDdEUsQ0FBQztJQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7UUFDZCxNQUFNLENBQUMsS0FBSyxDQUFDLHlDQUF5QyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQzdELE1BQU0sR0FBRyxDQUFDO0lBQ1gsQ0FBQztBQUNGLENBQUMsQ0FBQztBQUVGLCtCQUErQjtBQUMvQixNQUFNLENBQUMsTUFBTSxhQUFhLEdBQUcsS0FBSyxJQUFtQixFQUFFO0lBQ3RELE1BQU0sTUFBTSxHQUFHLE1BQU0sV0FBVyxFQUFFLENBQUM7SUFDbkMsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsMkJBQTJCLENBQUMsQ0FBQztJQUNuRSxJQUFJLENBQUM7UUFDSixJQUFJLEVBQUUsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztZQUM3QixNQUFNLElBQUksR0FBRyxFQUFFLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsQ0FBQztZQUMvQyxTQUFTLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM5QixDQUFDO0lBQ0YsQ0FBQztJQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7UUFDZCxNQUFNLENBQUMsS0FBSyxDQUFDLDJCQUEyQixFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQy9DLFNBQVMsR0FBRyxFQUFFLENBQUMsQ0FBQyw0Q0FBNEM7SUFDN0QsQ0FBQztBQUNGLENBQUMsQ0FBQztBQUVGLHNDQUFzQztBQUN0QyxNQUFNLENBQUMsTUFBTSxjQUFjLEdBQUcsQ0FBQyxFQUFVLEVBQVEsRUFBRTtJQUNsRCxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDO1FBQzdCLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDbkIsYUFBYSxFQUFFLENBQUM7SUFDakIsQ0FBQztBQUNGLENBQUMsQ0FBQztBQUVGLHFCQUFxQjtBQUNyQixNQUFNLGFBQWEsR0FBRyxLQUFLLElBQW1CLEVBQUU7SUFDL0MsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsMkJBQTJCLENBQUMsQ0FBQztJQUNuRSxJQUFJLENBQUM7UUFDSixFQUFFLENBQUMsYUFBYSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsRUFBRSxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNyRSxDQUFDO0lBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztRQUNkLE9BQU8sQ0FBQyxLQUFLLENBQUMsMEJBQTBCLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDaEQsQ0FBQztBQUNGLENBQUMsQ0FBQztBQUVGLDJEQUEyRDtBQUMzRCxNQUFNLENBQUMsTUFBTSxxQkFBcUIsR0FBRyxDQUNwQyxHQUFZLEVBQ1osR0FBYSxFQUNiLElBQWtCLEVBQ1gsRUFBRTtJQUNULE1BQU0sUUFBUSxHQUFHLEdBQUcsQ0FBQyxFQUFFLENBQUM7SUFFeEIsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQ2YsT0FBTyxDQUFDLEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO1FBQ3JDLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxFQUFFLGFBQWEsRUFBRSxDQUFDLENBQUM7UUFDL0MsT0FBTztJQUNSLENBQUM7SUFFRCxJQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQztRQUN2RCxPQUFPLENBQUMsR0FBRyxDQUFDLHdDQUF3QyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBQ2hFLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxFQUFFLGVBQWUsRUFBRSxDQUFDLENBQUM7UUFDakQsT0FBTztJQUNSLENBQUM7SUFFRCxJQUFJLEVBQUUsQ0FBQztBQUNSLENBQUMsQ0FBQztBQUVGLDJDQUEyQztBQUMzQyxNQUFNLENBQUMsTUFBTSxtQkFBbUIsR0FBRyxDQUFDLEVBQVUsRUFBUSxFQUFFO0lBQ3ZELFNBQVMsR0FBRyxTQUFTLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsS0FBSyxJQUFJLEVBQUUsQ0FBQyxDQUFDO0lBQ25ELGFBQWEsRUFBRSxDQUFDO0FBQ2pCLENBQUMsQ0FBQztBQUVGLE1BQU0sQ0FBQyxNQUFNLHFCQUFxQixHQUFHLG1CQUFtQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgaW5SYW5nZSB9IGZyb20gJ3JhbmdlX2NoZWNrJztcbmltcG9ydCB7IExvZ2dlciB9IGZyb20gJ3dpbnN0b24nO1xuaW1wb3J0IHsgUmVxdWVzdCwgUmVzcG9uc2UsIE5leHRGdW5jdGlvbiB9IGZyb20gJ2V4cHJlc3MnO1xuaW1wb3J0IGZzIGZyb20gJ2ZzJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgX19kaXJuYW1lIH0gZnJvbSAnLi4vY29uZmlnL2xvYWRFbnYnO1xuaW1wb3J0IHNldHVwTG9nZ2VyIGZyb20gJy4uL2NvbmZpZy9sb2dnZXInO1xuXG5sZXQgYmxhY2tsaXN0OiBzdHJpbmdbXSA9IFtdO1xubGV0IGxvZ2dlcjogTG9nZ2VyO1xuXG4vLyBJbml0aWFsaXplIHJhbmdlQ2hlY2sgYW5kIGxvYWQgdGhlIGJsYWNrbGlzdFxuY29uc3QgaW5pdGlhbGl6ZUJsYWNrbGlzdCA9IGFzeW5jICgpOiBQcm9taXNlPHZvaWQ+ID0+IHtcblx0bG9nZ2VyID0gYXdhaXQgc2V0dXBMb2dnZXIoKTtcblx0dHJ5IHtcblx0XHRhd2FpdCBsb2FkQmxhY2tsaXN0KCk7XG5cdFx0bG9nZ2VyLmluZm8oJ0JsYWNrbGlzdCBhbmQgcmFuZ2VfY2hlY2sgbW9kdWxlIGxvYWRlZCBzdWNjZXNzZnVsbHkuJyk7XG5cdH0gY2F0Y2ggKGVycikge1xuXHRcdGxvZ2dlci5lcnJvcignRXJyb3IgZHVyaW5nIGJsYWNrbGlzdCBpbml0aWFsaXphdGlvbjogJywgZXJyKTtcblx0XHR0aHJvdyBlcnI7XG5cdH1cbn07XG5cbi8vIExvYWQgdGhlIGJsYWNrbGlzdCBmcm9tIGZpbGVcbmV4cG9ydCBjb25zdCBsb2FkQmxhY2tsaXN0ID0gYXN5bmMgKCk6IFByb21pc2U8dm9pZD4gPT4ge1xuXHRjb25zdCBsb2dnZXIgPSBhd2FpdCBzZXR1cExvZ2dlcigpO1xuXHRjb25zdCBmaWxlUGF0aCA9IHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi8uLi9kYXRhL2JsYWNrbGlzdC5qc29uJyk7XG5cdHRyeSB7XG5cdFx0aWYgKGZzLmV4aXN0c1N5bmMoZmlsZVBhdGgpKSB7XG5cdFx0XHRjb25zdCBkYXRhID0gZnMucmVhZEZpbGVTeW5jKGZpbGVQYXRoLCAndXRmOCcpO1xuXHRcdFx0YmxhY2tsaXN0ID0gSlNPTi5wYXJzZShkYXRhKTtcblx0XHR9XG5cdH0gY2F0Y2ggKGVycikge1xuXHRcdGxvZ2dlci5lcnJvcignRXJyb3IgbG9hZGluZyBibGFja2xpc3Q6ICcsIGVycik7XG5cdFx0YmxhY2tsaXN0ID0gW107IC8vIGRlZmF1bHQgdG8gZW1wdHkgYXJyYXkgaW4gY2FzZSBvZiBmYWlsdXJlXG5cdH1cbn07XG5cbi8vIEFkZCBhbiBJUCBvciByYW5nZSB0byB0aGUgYmxhY2tsaXN0XG5leHBvcnQgY29uc3QgYWRkVG9CbGFja2xpc3QgPSAoaXA6IHN0cmluZyk6IHZvaWQgPT4ge1xuXHRpZiAoIWJsYWNrbGlzdC5pbmNsdWRlcyhpcCkpIHtcblx0XHRibGFja2xpc3QucHVzaChpcCk7XG5cdFx0c2F2ZUJsYWNrbGlzdCgpO1xuXHR9XG59O1xuXG4vLyBTYXZlIHRoZSBibGFja2xpc3RcbmNvbnN0IHNhdmVCbGFja2xpc3QgPSBhc3luYyAoKTogUHJvbWlzZTx2b2lkPiA9PiB7XG5cdGNvbnN0IGZpbGVQYXRoID0gcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uLy4uL2RhdGEvYmxhY2tsaXN0Lmpzb24nKTtcblx0dHJ5IHtcblx0XHRmcy53cml0ZUZpbGVTeW5jKGZpbGVQYXRoLCBKU09OLnN0cmluZ2lmeShibGFja2xpc3QsIHVuZGVmaW5lZCwgMikpO1xuXHR9IGNhdGNoIChlcnIpIHtcblx0XHRjb25zb2xlLmVycm9yKCdFcnJvciBzYXZpbmcgYmxhY2tsaXN0OiAnLCBlcnIpO1xuXHR9XG59O1xuXG4vLyBNaWRkbGV3YXJlIHRvIGNoZWNrIGlmIHRoZSByZXF1ZXN0ZXIncyBJUCBpcyBibGFja2xpc3RlZFxuZXhwb3J0IGNvbnN0IGlwQmxhY2tsaXN0TWlkZGxld2FyZSA9IChcblx0cmVxOiBSZXF1ZXN0LFxuXHRyZXM6IFJlc3BvbnNlLFxuXHRuZXh0OiBOZXh0RnVuY3Rpb25cbik6IHZvaWQgPT4ge1xuXHRjb25zdCBjbGllbnRJcCA9IHJlcS5pcDtcblxuXHRpZiAoIWNsaWVudElwKSB7XG5cdFx0Y29uc29sZS5lcnJvcignQ2xpZW50IElQIHVuZGVmaW5lZCcpO1xuXHRcdHJlcy5zdGF0dXMoNTAwKS5qc29uKHsgZXJyb3I6ICdCYWQgcmVxdWVzdCcgfSk7XG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0aWYgKGJsYWNrbGlzdC5zb21lKHJhbmdlID0+IGluUmFuZ2UoY2xpZW50SXAsIHJhbmdlKSkpIHtcblx0XHRjb25zb2xlLmxvZyhgQmxvY2tlZCByZXF1ZXN0IGZyb20gYmxhY2tsaXN0ZWQgSVA6ICR7Y2xpZW50SXB9YCk7XG5cdFx0cmVzLnN0YXR1cyg0MDMpLmpzb24oeyBlcnJvcjogJ0FjY2VzcyBkZW5pZWQnIH0pO1xuXHRcdHJldHVybjtcblx0fVxuXG5cdG5leHQoKTtcbn07XG5cbi8vIFJlbW92ZSBhbiBJUCBvciByYW5nZSBmcm9tIHRoZSBibGFja2xpc3RcbmV4cG9ydCBjb25zdCByZW1vdmVGcm9tQmxhY2tsaXN0ID0gKGlwOiBzdHJpbmcpOiB2b2lkID0+IHtcblx0YmxhY2tsaXN0ID0gYmxhY2tsaXN0LmZpbHRlcihyYW5nZSA9PiByYW5nZSAhPSBpcCk7XG5cdHNhdmVCbGFja2xpc3QoKTtcbn07XG5cbmV4cG9ydCBjb25zdCBpbml0aWFsaXplSXBCbGFja2xpc3QgPSBpbml0aWFsaXplQmxhY2tsaXN0O1xuIl19
