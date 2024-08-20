// Guestbook - version 0.0.0 (initial development)
// Licensed under GNU GPLv3 (https://www.gnu.org/licenses/gpl-3.0.html)
// Author: Viihna Lehraine (viihna@viihnatech.com || viihna.78 (Signal) || Viihna-Lehraine (Github))
import { __awaiter } from 'tslib';
import express from 'express';
import 'express-async-errors';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import hpp from 'hpp';
import morgan from 'morgan';
import path from 'path';
import passport from 'passport';
import { randomBytes } from 'crypto';
// import sentry from '@sentry/node';
// import session from 'express-session';
// import connectRedis from 'connect-redis';
import staticRoutes from './routes/staticRoutes';
import apiRoutes from './routes/apiRoutes';
import loadEnv from './config/loadEnv';
import setupLogger from './middleware/logger';
import getSecrets from './config/secrets';
// import sops from './config/sops';
import {
	configurePassport,
	csrfMiddleware,
	initializeDatabase,
	initializeIpBlacklist,
	ipBlacklistMiddleware,
	loadTestRoutes,
	rateLimitMiddleware,
	setupSecurityHeaders,
	startServer
} from './index';
import '../types/custom/express-async-errors';
let app = express();
// let RedisStore = connectRedis(session);
// let { decryptDataFiles } = sops;
loadEnv();
function initializeServer() {
	return __awaiter(this, void 0, void 0, function* () {
		let logger = yield setupLogger();
		let sequelize = yield initializeDatabase();
		// let ipLists = await decryptDataFiles();
		let staticRootPath = process.env.STATIC_ROOT_PATH;
		yield configurePassport(passport);
		yield initializeIpBlacklist();
		try {
			yield getSecrets();
			// Session management with Redis
			/* app.use(
                session({
                    store: new RedisStore({ client: redisClient }),
                    // secret: 'secrets.REDIS_KEY',
                    resave: false,
                    saveUninitialized: false,
                    cookie: { secure: true },
                })
            ); */
			// Apply CSRF Middleware (no sessions)
			app.use(csrfMiddleware);
			// Implement Caching
			/*
            app.get('/your-route', (req, res) => {
                const cacheKey = 'your-cache-key';
    
                client.get(cacheKey, (err, data) => {
                    if (err) throw err;
    
                    if (data) {
                        return res.json(JSON.parse(data));
                    } else {
                    // Fetch data from the database
                    // Cache the data
                    client.setex(cacheKey, 3600, JSON.stringify(yourData));
                    return res.json(yourData);
                    }
                });
            }); */
			// Parse JSON
			app.use(bodyParser.json());
			// Parse URL-encoded content
			app.use(express.urlencoded({ extended: true }));
			// Load test routes
			loadTestRoutes(app);
			// Configure express-session to use session data (necessary for slowdownMiddleware to work)
			/* app.use(session({
                secret: 'your_secret_key',
                resave: false,
                saveUninitialized: true,
            })); */
			// Apply Sentry middleware for request and error handling
			// app.use(Sentry.RequestHandlers.requestHandler());
			// app.use(Sentry.Handlers.errorHandler());
			// Apply global IP blacklistr
			app.use(ipBlacklistMiddleware);
			// Apply custom slowdown middleware
			// app.use(slowdownMiddleware);
			// Apply rate limiter middleware to all requests
			app.use(rateLimitMiddleware);
			// Generate nonce for each request
			app.use((req, res, next) => {
				res.locals.cspNonce = randomBytes(16).toString('hex');
				next();
			});
			// Apply CORS middleware
			app.use(
				cors({
					// origin: 'https://guestbook.com',
					methods: 'GET,POST,PUT,DELETE',
					allowedHeaders: 'Content-Type,Authorization', // allow specific headers
					credentials: true // allow cookies to be sent
				})
			);
			// Apply 'hpp' middleware to sanitize query parameters
			app.use(hpp());
			// Apply Security Headers
			setupSecurityHeaders(app);
			// HTTP Request Logging
			app.use(
				morgan('combined', {
					stream: {
						write: (message) => logger.info(message.trim())
					}
				})
			);
			// Initialize Passport
			app.use(passport.initialize());
			// Add Cookie Parser
			app.use(cookieParser());
			// Serve Static Files from the /public Directory
			app.use(express.static(staticRootPath));
			// Use Static Routes
			app.use('/', staticRoutes);
			// Use API Eoutes
			app.use('/api', apiRoutes);
			// 404 error handling
			app.use((req, res, next) => {
				res.status(404).sendFile(
					path.join(__dirname, '../public', 'not-found.html')
				);
				next();
			});
			// Error Handling Middleware
			app.use((err, req, res, next) => {
				logger.error(
					'Error occurred: ',
					err.stack || err.message || err
				);
				res.status(500).send(
					`Server error - something failed ${err.stack}`
				);
				next();
			});
			// Test database connection and sync models
			try {
				yield sequelize.sync();
				logger.info('Database and tables created!');
			} catch (err) {
				logger.error(
					'Database Connection Test and Sync: Server error: ',
					err
				);
				throw err;
			}
			// Enforce HTTPS Redirects
			logger.info('Enforcing HTTPS redirects');
			app.use((req, res, next) => {
				// redirect HTTP to HTTPS
				if (req.header('x-forwarded-proto') !== 'https') {
					res.redirect(`https://${req.header('host')}${req.url}`);
				} else {
					next();
				}
			});
			// Start the server with either HTTP1.1 or HTTP2, dependent on feature flags
			yield startServer();
		} catch (err) {
			logger.error('Failed to start server: ', err);
			process.exit(1); // exit process with failure
		}
	});
}
initializeServer();
export default app;
// *DEV-NOTE* need to implement session management
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vdHMvc2VydmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLGtEQUFrRDtBQUNsRCx1RUFBdUU7QUFDdkUsb0dBQW9HOztBQUVwRyxPQUFPLE9BQU8sTUFBTSxTQUFTLENBQUM7QUFFOUIsT0FBTyxzQkFBc0IsQ0FBQztBQUM5QixPQUFPLFVBQVUsTUFBTSxhQUFhLENBQUM7QUFDckMsT0FBTyxZQUFZLE1BQU0sZUFBZSxDQUFDO0FBQ3pDLE9BQU8sSUFBSSxNQUFNLE1BQU0sQ0FBQztBQUN4QixPQUFPLEdBQUcsTUFBTSxLQUFLLENBQUM7QUFDdEIsT0FBTyxNQUFNLE1BQU0sUUFBUSxDQUFDO0FBQzVCLE9BQU8sSUFBSSxNQUFNLE1BQU0sQ0FBQztBQUN4QixPQUFPLFFBQVEsTUFBTSxVQUFVLENBQUM7QUFDaEMsT0FBTyxFQUFFLFdBQVcsRUFBRSxNQUFNLFFBQVEsQ0FBQztBQUNyQyxxQ0FBcUM7QUFDckMseUNBQXlDO0FBQ3pDLDRDQUE0QztBQUM1QyxPQUFPLFlBQVksTUFBTSx1QkFBdUIsQ0FBQztBQUNqRCxPQUFPLFNBQVMsTUFBTSxvQkFBb0IsQ0FBQztBQUMzQyxPQUFPLE9BQU8sTUFBTSxrQkFBa0IsQ0FBQztBQUN2QyxPQUFPLFdBQVcsTUFBTSxxQkFBcUIsQ0FBQztBQUM5QyxPQUFPLFVBQVUsTUFBTSxrQkFBa0IsQ0FBQztBQUMxQyxvQ0FBb0M7QUFDcEMsT0FBTyxFQUNOLGlCQUFpQixFQUNqQixjQUFjLEVBQ2Qsa0JBQWtCLEVBQ2xCLHFCQUFxQixFQUNyQixxQkFBcUIsRUFDckIsY0FBYyxFQUNkLG1CQUFtQixFQUNuQixvQkFBb0IsRUFDcEIsV0FBVyxFQUNYLE1BQU0sU0FBUyxDQUFDO0FBQ2pCLE9BQU8sc0NBQXNDLENBQUM7QUFFOUMsSUFBSSxHQUFHLEdBQUcsT0FBTyxFQUFFLENBQUM7QUFDcEIsMENBQTBDO0FBRTFDLG1DQUFtQztBQUVuQyxP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LENBQUMsR0FBWSxFQUFFLEdBQWEsRUFBRSxJQUFrQixFQUFFLEVBQUU7Z0JBQzNELHlCQUF5QjtnQkFDekIsSUFBSSxHQUFHLENBQUMsTUFBTSxDQUFDLG1CQUFtQixDQUFDLEtBQUssT0FBTyxFQUFFLENBQUM7b0JBQ2pELEdBQUcsQ0FBQyxRQUFRLENBQUMsV0FBVyxHQUFHLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxHQUFHLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDO2dCQUN6RCxDQUFDO3FCQUFNLENBQUM7b0JBQ1AsSUFBSSxFQUFFLENBQUM7Z0JBQ1IsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDO1lBRUgsNEVBQTRFO1lBQzVFLE1BQU0sV0FBVyxFQUFFLENBQUM7UUFDckIsQ0FBQztRQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7WUFDZCxNQUFNLENBQUMsS0FBSyxDQUFDLDBCQUEwQixFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQzlDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyw0QkFBNEI7UUFDOUMsQ0FBQztJQUNGLENBQUM7Q0FBQTtBQUVELGdCQUFnQixFQUFFLENBQUM7QUFFbkIsZUFBZSxHQUFHLENBQUM7QUFFbkIsa0RBQWtEIiwic291cmNlc0NvbnRlbnQiOlsiLy8gR3Vlc3Rib29rIC0gdmVyc2lvbiAwLjAuMCAoaW5pdGlhbCBkZXZlbG9wbWVudClcbi8vIExpY2Vuc2VkIHVuZGVyIEdOVSBHUEx2MyAoaHR0cHM6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy9ncGwtMy4wLmh0bWwpXG4vLyBBdXRob3I6IFZpaWhuYSBMZWhyYWluZSAodmlpaG5hQHZpaWhuYXRlY2guY29tIHx8IHZpaWhuYS43OCAoU2lnbmFsKSB8fCBWaWlobmEtTGVocmFpbmUgKEdpdGh1YikpXG5cbmltcG9ydCBleHByZXNzIGZyb20gJ2V4cHJlc3MnO1xuaW1wb3J0IHsgUmVxdWVzdCwgUmVzcG9uc2UsIE5leHRGdW5jdGlvbiB9IGZyb20gJ2V4cHJlc3MnO1xuaW1wb3J0ICdleHByZXNzLWFzeW5jLWVycm9ycyc7XG5pbXBvcnQgYm9keVBhcnNlciBmcm9tICdib2R5LXBhcnNlcic7XG5pbXBvcnQgY29va2llUGFyc2VyIGZyb20gJ2Nvb2tpZS1wYXJzZXInO1xuaW1wb3J0IGNvcnMgZnJvbSAnY29ycyc7XG5pbXBvcnQgaHBwIGZyb20gJ2hwcCc7XG5pbXBvcnQgbW9yZ2FuIGZyb20gJ21vcmdhbic7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCBwYXNzcG9ydCBmcm9tICdwYXNzcG9ydCc7XG5pbXBvcnQgeyByYW5kb21CeXRlcyB9IGZyb20gJ2NyeXB0byc7XG4vLyBpbXBvcnQgc2VudHJ5IGZyb20gJ0BzZW50cnkvbm9kZSc7XG4vLyBpbXBvcnQgc2Vzc2lvbiBmcm9tICdleHByZXNzLXNlc3Npb24nO1xuLy8gaW1wb3J0IGNvbm5lY3RSZWRpcyBmcm9tICdjb25uZWN0LXJlZGlzJztcbmltcG9ydCBzdGF0aWNSb3V0ZXMgZnJvbSAnLi9yb3V0ZXMvc3RhdGljUm91dGVzJztcbmltcG9ydCBhcGlSb3V0ZXMgZnJvbSAnLi9yb3V0ZXMvYXBpUm91dGVzJztcbmltcG9ydCBsb2FkRW52IGZyb20gJy4vY29uZmlnL2xvYWRFbnYnO1xuaW1wb3J0IHNldHVwTG9nZ2VyIGZyb20gJy4vbWlkZGxld2FyZS9sb2dnZXInO1xuaW1wb3J0IGdldFNlY3JldHMgZnJvbSAnLi9jb25maWcvc2VjcmV0cyc7XG4vLyBpbXBvcnQgc29wcyBmcm9tICcuL2NvbmZpZy9zb3BzJztcbmltcG9ydCB7XG5cdGNvbmZpZ3VyZVBhc3Nwb3J0LFxuXHRjc3JmTWlkZGxld2FyZSxcblx0aW5pdGlhbGl6ZURhdGFiYXNlLFxuXHRpbml0aWFsaXplSXBCbGFja2xpc3QsXG5cdGlwQmxhY2tsaXN0TWlkZGxld2FyZSxcblx0bG9hZFRlc3RSb3V0ZXMsXG5cdHJhdGVMaW1pdE1pZGRsZXdhcmUsXG5cdHNldHVwU2VjdXJpdHlIZWFkZXJzLFxuXHRzdGFydFNlcnZlclxufSBmcm9tICcuL2luZGV4JztcbmltcG9ydCAnLi4vdHlwZXMvY3VzdG9tL2V4cHJlc3MtYXN5bmMtZXJyb3JzJztcblxubGV0IGFwcCA9IGV4cHJlc3MoKTtcbi8vIGxldCBSZWRpc1N0b3JlID0gY29ubmVjdFJlZGlzKHNlc3Npb24pO1xuXG4vLyBsZXQgeyBkZWNyeXB0RGF0YUZpbGVzIH0gPSBzb3BzO1xuXG5sb2FkRW52KCk7XG5cbmFzeW5jIGZ1bmN0aW9uIGluaXRpYWxpemVTZXJ2ZXIoKSB7XG5cdGxldCBsb2dnZXIgPSBhd2FpdCBzZXR1cExvZ2dlcigpO1xuXHRsZXQgc2VxdWVsaXplID0gYXdhaXQgaW5pdGlhbGl6ZURhdGFiYXNlKCk7XG5cdC8vIGxldCBpcExpc3RzID0gYXdhaXQgZGVjcnlwdERhdGFGaWxlcygpO1xuXHRsZXQgc3RhdGljUm9vdFBhdGggPSBwcm9jZXNzLmVudi5TVEFUSUNfUk9PVF9QQVRIITtcblxuXHRhd2FpdCBjb25maWd1cmVQYXNzcG9ydChwYXNzcG9ydCk7XG5cdGF3YWl0IGluaXRpYWxpemVJcEJsYWNrbGlzdCgpO1xuXG5cdHRyeSB7XG5cdFx0YXdhaXQgZ2V0U2VjcmV0cygpO1xuXHRcdC8vIFNlc3Npb24gbWFuYWdlbWVudCB3aXRoIFJlZGlzXG5cdFx0LyogYXBwLnVzZShcblx0XHRcdHNlc3Npb24oe1xuXHRcdFx0XHRzdG9yZTogbmV3IFJlZGlzU3RvcmUoeyBjbGllbnQ6IHJlZGlzQ2xpZW50IH0pLFxuXHRcdFx0XHQvLyBzZWNyZXQ6ICdzZWNyZXRzLlJFRElTX0tFWScsXG5cdFx0XHRcdHJlc2F2ZTogZmFsc2UsXG5cdFx0XHRcdHNhdmVVbmluaXRpYWxpemVkOiBmYWxzZSxcblx0XHRcdFx0Y29va2llOiB7IHNlY3VyZTogdHJ1ZSB9LFxuXHRcdFx0fSlcblx0XHQpOyAqL1xuXG5cdFx0Ly8gQXBwbHkgQ1NSRiBNaWRkbGV3YXJlIChubyBzZXNzaW9ucylcblx0XHRhcHAudXNlKGNzcmZNaWRkbGV3YXJlKTtcblxuXHRcdC8vIEltcGxlbWVudCBDYWNoaW5nXG5cdFx0Lypcblx0XHRhcHAuZ2V0KCcveW91ci1yb3V0ZScsIChyZXEsIHJlcykgPT4ge1xuXHRcdFx0Y29uc3QgY2FjaGVLZXkgPSAneW91ci1jYWNoZS1rZXknO1xuXG5cdCAgXHRcdGNsaWVudC5nZXQoY2FjaGVLZXksIChlcnIsIGRhdGEpID0+IHtcblx0ICAgIFx0XHRpZiAoZXJyKSB0aHJvdyBlcnI7XG5cblx0ICAgIFx0XHRpZiAoZGF0YSkge1xuXHQgICAgICBcdFx0XHRyZXR1cm4gcmVzLmpzb24oSlNPTi5wYXJzZShkYXRhKSk7XG5cdCAgICBcdFx0fSBlbHNlIHtcblx0ICAgICAgXHRcdC8vIEZldGNoIGRhdGEgZnJvbSB0aGUgZGF0YWJhc2Vcblx0ICAgICAgXHRcdC8vIENhY2hlIHRoZSBkYXRhXG5cdCAgICAgIFx0XHRjbGllbnQuc2V0ZXgoY2FjaGVLZXksIDM2MDAsIEpTT04uc3RyaW5naWZ5KHlvdXJEYXRhKSk7XG5cdCAgICAgIFx0XHRyZXR1cm4gcmVzLmpzb24oeW91ckRhdGEpO1xuXHQgICAgXHRcdH1cblx0ICBcdFx0fSk7XG5cdFx0fSk7ICovXG5cblx0XHQvLyBQYXJzZSBKU09OXG5cdFx0YXBwLnVzZShib2R5UGFyc2VyLmpzb24oKSk7XG5cblx0XHQvLyBQYXJzZSBVUkwtZW5jb2RlZCBjb250ZW50XG5cdFx0YXBwLnVzZShleHByZXNzLnVybGVuY29kZWQoeyBleHRlbmRlZDogdHJ1ZSB9KSk7XG5cblx0XHQvLyBMb2FkIHRlc3Qgcm91dGVzXG5cdFx0bG9hZFRlc3RSb3V0ZXMoYXBwKTtcblxuXHRcdC8vIENvbmZpZ3VyZSBleHByZXNzLXNlc3Npb24gdG8gdXNlIHNlc3Npb24gZGF0YSAobmVjZXNzYXJ5IGZvciBzbG93ZG93bk1pZGRsZXdhcmUgdG8gd29yaylcblx0XHQvKiBhcHAudXNlKHNlc3Npb24oe1xuXHRcdFx0c2VjcmV0OiAneW91cl9zZWNyZXRfa2V5Jyxcblx0XHRcdHJlc2F2ZTogZmFsc2UsXG5cdFx0XHRzYXZlVW5pbml0aWFsaXplZDogdHJ1ZSxcblx0XHR9KSk7ICovXG5cblx0XHQvLyBBcHBseSBTZW50cnkgbWlkZGxld2FyZSBmb3IgcmVxdWVzdCBhbmQgZXJyb3IgaGFuZGxpbmdcblx0XHQvLyBhcHAudXNlKFNlbnRyeS5SZXF1ZXN0SGFuZGxlcnMucmVxdWVzdEhhbmRsZXIoKSk7XG5cdFx0Ly8gYXBwLnVzZShTZW50cnkuSGFuZGxlcnMuZXJyb3JIYW5kbGVyKCkpO1xuXG5cdFx0Ly8gQXBwbHkgZ2xvYmFsIElQIGJsYWNrbGlzdHJcblx0XHRhcHAudXNlKGlwQmxhY2tsaXN0TWlkZGxld2FyZSk7XG5cblx0XHQvLyBBcHBseSBjdXN0b20gc2xvd2Rvd24gbWlkZGxld2FyZVxuXHRcdC8vIGFwcC51c2Uoc2xvd2Rvd25NaWRkbGV3YXJlKTtcblxuXHRcdC8vIEFwcGx5IHJhdGUgbGltaXRlciBtaWRkbGV3YXJlIHRvIGFsbCByZXF1ZXN0c1xuXHRcdGFwcC51c2UocmF0ZUxpbWl0TWlkZGxld2FyZSk7XG5cblx0XHQvLyBHZW5lcmF0ZSBub25jZSBmb3IgZWFjaCByZXF1ZXN0XG5cdFx0YXBwLnVzZSgocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlLCBuZXh0OiBOZXh0RnVuY3Rpb24pID0+IHtcblx0XHRcdHJlcy5sb2NhbHMuY3NwTm9uY2UgPSByYW5kb21CeXRlcygxNikudG9TdHJpbmcoJ2hleCcpO1xuXHRcdFx0bmV4dCgpO1xuXHRcdH0pO1xuXG5cdFx0Ly8gQXBwbHkgQ09SUyBtaWRkbGV3YXJlXG5cdFx0YXBwLnVzZShcblx0XHRcdGNvcnMoe1xuXHRcdFx0XHQvLyBvcmlnaW46ICdodHRwczovL2d1ZXN0Ym9vay5jb20nLFxuXHRcdFx0XHRtZXRob2RzOiAnR0VULFBPU1QsUFVULERFTEVURScsXG5cdFx0XHRcdGFsbG93ZWRIZWFkZXJzOiAnQ29udGVudC1UeXBlLEF1dGhvcml6YXRpb24nLCAvLyBhbGxvdyBzcGVjaWZpYyBoZWFkZXJzXG5cdFx0XHRcdGNyZWRlbnRpYWxzOiB0cnVlIC8vIGFsbG93IGNvb2tpZXMgdG8gYmUgc2VudFxuXHRcdFx0fSlcblx0XHQpO1xuXG5cdFx0Ly8gQXBwbHkgJ2hwcCcgbWlkZGxld2FyZSB0byBzYW5pdGl6ZSBxdWVyeSBwYXJhbWV0ZXJzXG5cdFx0YXBwLnVzZShocHAoKSk7XG5cblx0XHQvLyBBcHBseSBTZWN1cml0eSBIZWFkZXJzXG5cdFx0c2V0dXBTZWN1cml0eUhlYWRlcnMoYXBwKTtcblxuXHRcdC8vIEhUVFAgUmVxdWVzdCBMb2dnaW5nXG5cdFx0YXBwLnVzZShcblx0XHRcdG1vcmdhbignY29tYmluZWQnLCB7XG5cdFx0XHRcdHN0cmVhbToge1xuXHRcdFx0XHRcdHdyaXRlOiAobWVzc2FnZSkgPT4gbG9nZ2VyLmluZm8obWVzc2FnZS50cmltKCkpXG5cdFx0XHRcdH1cblx0XHRcdH0pXG5cdFx0KTtcblxuXHRcdC8vIEluaXRpYWxpemUgUGFzc3BvcnRcblx0XHRhcHAudXNlKHBhc3Nwb3J0LmluaXRpYWxpemUoKSk7XG5cblx0XHQvLyBBZGQgQ29va2llIFBhcnNlclxuXHRcdGFwcC51c2UoY29va2llUGFyc2VyKCkpO1xuXG5cdFx0Ly8gU2VydmUgU3RhdGljIEZpbGVzIGZyb20gdGhlIC9wdWJsaWMgRGlyZWN0b3J5XG5cdFx0YXBwLnVzZShleHByZXNzLnN0YXRpYyhzdGF0aWNSb290UGF0aCkpO1xuXG5cdFx0Ly8gVXNlIFN0YXRpYyBSb3V0ZXNcblx0XHRhcHAudXNlKCcvJywgc3RhdGljUm91dGVzKTtcblxuXHRcdC8vIFVzZSBBUEkgRW91dGVzXG5cdFx0YXBwLnVzZSgnL2FwaScsIGFwaVJvdXRlcyk7XG5cblx0XHQvLyA0MDQgZXJyb3IgaGFuZGxpbmdcblx0XHRhcHAudXNlKChyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UsIG5leHQ6IE5leHRGdW5jdGlvbikgPT4ge1xuXHRcdFx0cmVzLnN0YXR1cyg0MDQpLnNlbmRGaWxlKFxuXHRcdFx0XHRwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vcHVibGljJywgJ25vdC1mb3VuZC5odG1sJylcblx0XHRcdCk7XG5cdFx0XHRuZXh0KCk7XG5cdFx0fSk7XG5cblx0XHQvLyBFcnJvciBIYW5kbGluZyBNaWRkbGV3YXJlXG5cdFx0YXBwLnVzZShcblx0XHRcdChlcnI6IEVycm9yLCByZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UsIG5leHQ6IE5leHRGdW5jdGlvbikgPT4ge1xuXHRcdFx0XHRsb2dnZXIuZXJyb3IoXG5cdFx0XHRcdFx0J0Vycm9yIG9jY3VycmVkOiAnLFxuXHRcdFx0XHRcdGVyci5zdGFjayB8fCBlcnIubWVzc2FnZSB8fCBlcnJcblx0XHRcdFx0KTtcblx0XHRcdFx0cmVzLnN0YXR1cyg1MDApLnNlbmQoXG5cdFx0XHRcdFx0YFNlcnZlciBlcnJvciAtIHNvbWV0aGluZyBmYWlsZWQgJHtlcnIuc3RhY2t9YFxuXHRcdFx0XHQpO1xuXG5cdFx0XHRcdG5leHQoKTtcblx0XHRcdH1cblx0XHQpO1xuXG5cdFx0Ly8gVGVzdCBkYXRhYmFzZSBjb25uZWN0aW9uIGFuZCBzeW5jIG1vZGVsc1xuXHRcdHRyeSB7XG5cdFx0XHRhd2FpdCBzZXF1ZWxpemUuc3luYygpO1xuXHRcdFx0bG9nZ2VyLmluZm8oJ0RhdGFiYXNlIGFuZCB0YWJsZXMgY3JlYXRlZCEnKTtcblx0XHR9IGNhdGNoIChlcnIpIHtcblx0XHRcdGxvZ2dlci5lcnJvcihcblx0XHRcdFx0J0RhdGFiYXNlIENvbm5lY3Rpb24gVGVzdCBhbmQgU3luYzogU2VydmVyIGVycm9yOiAnLFxuXHRcdFx0XHRlcnJcblx0XHRcdCk7XG5cdFx0XHR0aHJvdyBlcnI7XG5cdFx0fVxuXG5cdFx0Ly8gRW5mb3JjZSBIVFRQUyBSZWRpcmVjdHNcblx0XHRsb2dnZXIuaW5mbygnRW5mb3JjaW5nIEhUVFBTIHJlZGlyZWN0cycpO1xuXHRcdGFwcC51c2UoKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSwgbmV4dDogTmV4dEZ1bmN0aW9uKSA9PiB7XG5cdFx0XHQvLyByZWRpcmVjdCBIVFRQIHRvIEhUVFBTXG5cdFx0XHRpZiAocmVxLmhlYWRlcigneC1mb3J3YXJkZWQtcHJvdG8nKSAhPT0gJ2h0dHBzJykge1xuXHRcdFx0XHRyZXMucmVkaXJlY3QoYGh0dHBzOi8vJHtyZXEuaGVhZGVyKCdob3N0Jyl9JHtyZXEudXJsfWApO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0bmV4dCgpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0Ly8gU3RhcnQgdGhlIHNlcnZlciB3aXRoIGVpdGhlciBIVFRQMS4xIG9yIEhUVFAyLCBkZXBlbmRlbnQgb24gZmVhdHVyZSBmbGFnc1xuXHRcdGF3YWl0IHN0YXJ0U2VydmVyKCk7XG5cdH0gY2F0Y2ggKGVycikge1xuXHRcdGxvZ2dlci5lcnJvcignRmFpbGVkIHRvIHN0YXJ0IHNlcnZlcjogJywgZXJyKTtcblx0XHRwcm9jZXNzLmV4aXQoMSk7IC8vIGV4aXQgcHJvY2VzcyB3aXRoIGZhaWx1cmVcblx0fVxufVxuXG5pbml0aWFsaXplU2VydmVyKCk7XG5cbmV4cG9ydCBkZWZhdWx0IGFwcDtcblxuLy8gKkRFVi1OT1RFKiBuZWVkIHRvIGltcGxlbWVudCBzZXNzaW9uIG1hbmFnZW1lbnRcbiJdfQ==
