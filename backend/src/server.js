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
import initializeStaticRoutes from './routes/staticRoutes.js';
import apiRoutes from './routes/apiRoutes.js';
import loadEnv from './config/loadEnv.js';
import setupLogger from './middleware/logger.js';
import getSecrets from './config/secrets.js';
// import sops from './config/sops.js';
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
} from './index.js';
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
			app.use('/', initializeStaticRoutes);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vdHMvc2VydmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLGtEQUFrRDtBQUNsRCx1RUFBdUU7QUFDdkUsb0dBQW9HOztBQUVwRyxPQUFPLE9BQU8sTUFBTSxTQUFTLENBQUM7QUFFOUIsT0FBTyxzQkFBc0IsQ0FBQztBQUM5QixPQUFPLFVBQVUsTUFBTSxhQUFhLENBQUM7QUFDckMsT0FBTyxZQUFZLE1BQU0sZUFBZSxDQUFDO0FBQ3pDLE9BQU8sSUFBSSxNQUFNLE1BQU0sQ0FBQztBQUN4QixPQUFPLEdBQUcsTUFBTSxLQUFLLENBQUM7QUFDdEIsT0FBTyxNQUFNLE1BQU0sUUFBUSxDQUFDO0FBQzVCLE9BQU8sSUFBSSxNQUFNLE1BQU0sQ0FBQztBQUN4QixPQUFPLFFBQVEsTUFBTSxVQUFVLENBQUM7QUFDaEMsT0FBTyxFQUFFLFdBQVcsRUFBRSxNQUFNLFFBQVEsQ0FBQztBQUNyQyxxQ0FBcUM7QUFDckMseUNBQXlDO0FBQ3pDLDRDQUE0QztBQUM1QyxPQUFPLHNCQUFzQixNQUFNLHVCQUF1QixDQUFDO0FBQzNELE9BQU8sU0FBUyxNQUFNLG9CQUFvQixDQUFDO0FBQzNDLE9BQU8sT0FBTyxNQUFNLGtCQUFrQixDQUFDO0FBQ3ZDLE9BQU8sV0FBVyxNQUFNLHFCQUFxQixDQUFDO0FBQzlDLE9BQU8sVUFBVSxNQUFNLGtCQUFrQixDQUFDO0FBQzFDLG9DQUFvQztBQUNwQyxPQUFPLEVBQ04saUJBQWlCLEVBQ2pCLGNBQWMsRUFDZCxrQkFBa0IsRUFDbEIscUJBQXFCLEVBQ3JCLHFCQUFxQixFQUNyQixjQUFjLEVBQ2QsbUJBQW1CLEVBQ25CLG9CQUFvQixFQUNwQixXQUFXLEVBQ1gsTUFBTSxTQUFTLENBQUM7QUFDakIsT0FBTyxzQ0FBc0MsQ0FBQztBQUU5QyxJQUFJLEdBQUcsR0FBRyxPQUFPLEVBQUUsQ0FBQztBQUNwQiwwQ0FBMEM7QUFFMUMsbUNBQW1DO0FBRW5D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Q0FBQyxDQUFDLEdBQVksRUFBRSxHQUFhLEVBQUUsSUFBa0IsRUFBRSxFQUFFO2dCQUMzRCx5QkFBeUI7Z0JBQ3pCLElBQUksR0FBRyxDQUFDLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxLQUFLLE9BQU8sRUFBRSxDQUFDO29CQUNqRCxHQUFHLENBQUMsUUFBUSxDQUFDLFdBQVcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQztnQkFDekQsQ0FBQztxQkFBTSxDQUFDO29CQUNQLElBQUksRUFBRSxDQUFDO2dCQUNSLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQztZQUVILDRFQUE0RTtZQUM1RSxNQUFNLFdBQVcsRUFBRSxDQUFDO1FBQ3JCLENBQUM7UUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1lBQ2QsTUFBTSxDQUFDLEtBQUssQ0FBQywwQkFBMEIsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUM5QyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsNEJBQTRCO1FBQzlDLENBQUM7SUFDRixDQUFDO0NBQUE7QUFFRCxnQkFBZ0IsRUFBRSxDQUFDO0FBRW5CLGVBQWUsR0FBRyxDQUFDO0FBRW5CLGtEQUFrRCIsInNvdXJjZXNDb250ZW50IjpbIi8vIEd1ZXN0Ym9vayAtIHZlcnNpb24gMC4wLjAgKGluaXRpYWwgZGV2ZWxvcG1lbnQpXG4vLyBMaWNlbnNlZCB1bmRlciBHTlUgR1BMdjMgKGh0dHBzOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvZ3BsLTMuMC5odG1sKVxuLy8gQXV0aG9yOiBWaWlobmEgTGVocmFpbmUgKHZpaWhuYUB2aWlobmF0ZWNoLmNvbSB8fCB2aWlobmEuNzggKFNpZ25hbCkgfHwgVmlpaG5hLUxlaHJhaW5lIChHaXRodWIpKVxuXG5pbXBvcnQgZXhwcmVzcyBmcm9tICdleHByZXNzJztcbmltcG9ydCB7IFJlcXVlc3QsIFJlc3BvbnNlLCBOZXh0RnVuY3Rpb24gfSBmcm9tICdleHByZXNzJztcbmltcG9ydCAnZXhwcmVzcy1hc3luYy1lcnJvcnMnO1xuaW1wb3J0IGJvZHlQYXJzZXIgZnJvbSAnYm9keS1wYXJzZXInO1xuaW1wb3J0IGNvb2tpZVBhcnNlciBmcm9tICdjb29raWUtcGFyc2VyJztcbmltcG9ydCBjb3JzIGZyb20gJ2NvcnMnO1xuaW1wb3J0IGhwcCBmcm9tICdocHAnO1xuaW1wb3J0IG1vcmdhbiBmcm9tICdtb3JnYW4nO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgcGFzc3BvcnQgZnJvbSAncGFzc3BvcnQnO1xuaW1wb3J0IHsgcmFuZG9tQnl0ZXMgfSBmcm9tICdjcnlwdG8nO1xuLy8gaW1wb3J0IHNlbnRyeSBmcm9tICdAc2VudHJ5L25vZGUnO1xuLy8gaW1wb3J0IHNlc3Npb24gZnJvbSAnZXhwcmVzcy1zZXNzaW9uJztcbi8vIGltcG9ydCBjb25uZWN0UmVkaXMgZnJvbSAnY29ubmVjdC1yZWRpcyc7XG5pbXBvcnQgaW5pdGlhbGl6ZVN0YXRpY1JvdXRlcyBmcm9tICcuL3JvdXRlcy9zdGF0aWNSb3V0ZXMnO1xuaW1wb3J0IGFwaVJvdXRlcyBmcm9tICcuL3JvdXRlcy9hcGlSb3V0ZXMnO1xuaW1wb3J0IGxvYWRFbnYgZnJvbSAnLi9jb25maWcvbG9hZEVudic7XG5pbXBvcnQgc2V0dXBMb2dnZXIgZnJvbSAnLi9taWRkbGV3YXJlL2xvZ2dlcic7XG5pbXBvcnQgZ2V0U2VjcmV0cyBmcm9tICcuL2NvbmZpZy9zZWNyZXRzJztcbi8vIGltcG9ydCBzb3BzIGZyb20gJy4vY29uZmlnL3NvcHMnO1xuaW1wb3J0IHtcblx0Y29uZmlndXJlUGFzc3BvcnQsXG5cdGNzcmZNaWRkbGV3YXJlLFxuXHRpbml0aWFsaXplRGF0YWJhc2UsXG5cdGluaXRpYWxpemVJcEJsYWNrbGlzdCxcblx0aXBCbGFja2xpc3RNaWRkbGV3YXJlLFxuXHRsb2FkVGVzdFJvdXRlcyxcblx0cmF0ZUxpbWl0TWlkZGxld2FyZSxcblx0c2V0dXBTZWN1cml0eUhlYWRlcnMsXG5cdHN0YXJ0U2VydmVyXG59IGZyb20gJy4vaW5kZXgnO1xuaW1wb3J0ICcuLi90eXBlcy9jdXN0b20vZXhwcmVzcy1hc3luYy1lcnJvcnMnO1xuXG5sZXQgYXBwID0gZXhwcmVzcygpO1xuLy8gbGV0IFJlZGlzU3RvcmUgPSBjb25uZWN0UmVkaXMoc2Vzc2lvbik7XG5cbi8vIGxldCB7IGRlY3J5cHREYXRhRmlsZXMgfSA9IHNvcHM7XG5cbmxvYWRFbnYoKTtcblxuYXN5bmMgZnVuY3Rpb24gaW5pdGlhbGl6ZVNlcnZlcigpIHtcblx0bGV0IGxvZ2dlciA9IGF3YWl0IHNldHVwTG9nZ2VyKCk7XG5cdGxldCBzZXF1ZWxpemUgPSBhd2FpdCBpbml0aWFsaXplRGF0YWJhc2UoKTtcblx0Ly8gbGV0IGlwTGlzdHMgPSBhd2FpdCBkZWNyeXB0RGF0YUZpbGVzKCk7XG5cdGxldCBzdGF0aWNSb290UGF0aCA9IHByb2Nlc3MuZW52LlNUQVRJQ19ST09UX1BBVEghO1xuXG5cdGF3YWl0IGNvbmZpZ3VyZVBhc3Nwb3J0KHBhc3Nwb3J0KTtcblx0YXdhaXQgaW5pdGlhbGl6ZUlwQmxhY2tsaXN0KCk7XG5cblx0dHJ5IHtcblx0XHRhd2FpdCBnZXRTZWNyZXRzKCk7XG5cdFx0Ly8gU2Vzc2lvbiBtYW5hZ2VtZW50IHdpdGggUmVkaXNcblx0XHQvKiBhcHAudXNlKFxuXHRcdFx0c2Vzc2lvbih7XG5cdFx0XHRcdHN0b3JlOiBuZXcgUmVkaXNTdG9yZSh7IGNsaWVudDogcmVkaXNDbGllbnQgfSksXG5cdFx0XHRcdC8vIHNlY3JldDogJ3NlY3JldHMuUkVESVNfS0VZJyxcblx0XHRcdFx0cmVzYXZlOiBmYWxzZSxcblx0XHRcdFx0c2F2ZVVuaW5pdGlhbGl6ZWQ6IGZhbHNlLFxuXHRcdFx0XHRjb29raWU6IHsgc2VjdXJlOiB0cnVlIH0sXG5cdFx0XHR9KVxuXHRcdCk7ICovXG5cblx0XHQvLyBBcHBseSBDU1JGIE1pZGRsZXdhcmUgKG5vIHNlc3Npb25zKVxuXHRcdGFwcC51c2UoY3NyZk1pZGRsZXdhcmUpO1xuXG5cdFx0Ly8gSW1wbGVtZW50IENhY2hpbmdcblx0XHQvKlxuXHRcdGFwcC5nZXQoJy95b3VyLXJvdXRlJywgKHJlcSwgcmVzKSA9PiB7XG5cdFx0XHRjb25zdCBjYWNoZUtleSA9ICd5b3VyLWNhY2hlLWtleSc7XG5cblx0ICBcdFx0Y2xpZW50LmdldChjYWNoZUtleSwgKGVyciwgZGF0YSkgPT4ge1xuXHQgICAgXHRcdGlmIChlcnIpIHRocm93IGVycjtcblxuXHQgICAgXHRcdGlmIChkYXRhKSB7XG5cdCAgICAgIFx0XHRcdHJldHVybiByZXMuanNvbihKU09OLnBhcnNlKGRhdGEpKTtcblx0ICAgIFx0XHR9IGVsc2Uge1xuXHQgICAgICBcdFx0Ly8gRmV0Y2ggZGF0YSBmcm9tIHRoZSBkYXRhYmFzZVxuXHQgICAgICBcdFx0Ly8gQ2FjaGUgdGhlIGRhdGFcblx0ICAgICAgXHRcdGNsaWVudC5zZXRleChjYWNoZUtleSwgMzYwMCwgSlNPTi5zdHJpbmdpZnkoeW91ckRhdGEpKTtcblx0ICAgICAgXHRcdHJldHVybiByZXMuanNvbih5b3VyRGF0YSk7XG5cdCAgICBcdFx0fVxuXHQgIFx0XHR9KTtcblx0XHR9KTsgKi9cblxuXHRcdC8vIFBhcnNlIEpTT05cblx0XHRhcHAudXNlKGJvZHlQYXJzZXIuanNvbigpKTtcblxuXHRcdC8vIFBhcnNlIFVSTC1lbmNvZGVkIGNvbnRlbnRcblx0XHRhcHAudXNlKGV4cHJlc3MudXJsZW5jb2RlZCh7IGV4dGVuZGVkOiB0cnVlIH0pKTtcblxuXHRcdC8vIExvYWQgdGVzdCByb3V0ZXNcblx0XHRsb2FkVGVzdFJvdXRlcyhhcHApO1xuXG5cdFx0Ly8gQ29uZmlndXJlIGV4cHJlc3Mtc2Vzc2lvbiB0byB1c2Ugc2Vzc2lvbiBkYXRhIChuZWNlc3NhcnkgZm9yIHNsb3dkb3duTWlkZGxld2FyZSB0byB3b3JrKVxuXHRcdC8qIGFwcC51c2Uoc2Vzc2lvbih7XG5cdFx0XHRzZWNyZXQ6ICd5b3VyX3NlY3JldF9rZXknLFxuXHRcdFx0cmVzYXZlOiBmYWxzZSxcblx0XHRcdHNhdmVVbmluaXRpYWxpemVkOiB0cnVlLFxuXHRcdH0pKTsgKi9cblxuXHRcdC8vIEFwcGx5IFNlbnRyeSBtaWRkbGV3YXJlIGZvciByZXF1ZXN0IGFuZCBlcnJvciBoYW5kbGluZ1xuXHRcdC8vIGFwcC51c2UoU2VudHJ5LlJlcXVlc3RIYW5kbGVycy5yZXF1ZXN0SGFuZGxlcigpKTtcblx0XHQvLyBhcHAudXNlKFNlbnRyeS5IYW5kbGVycy5lcnJvckhhbmRsZXIoKSk7XG5cblx0XHQvLyBBcHBseSBnbG9iYWwgSVAgYmxhY2tsaXN0clxuXHRcdGFwcC51c2UoaXBCbGFja2xpc3RNaWRkbGV3YXJlKTtcblxuXHRcdC8vIEFwcGx5IGN1c3RvbSBzbG93ZG93biBtaWRkbGV3YXJlXG5cdFx0Ly8gYXBwLnVzZShzbG93ZG93bk1pZGRsZXdhcmUpO1xuXG5cdFx0Ly8gQXBwbHkgcmF0ZSBsaW1pdGVyIG1pZGRsZXdhcmUgdG8gYWxsIHJlcXVlc3RzXG5cdFx0YXBwLnVzZShyYXRlTGltaXRNaWRkbGV3YXJlKTtcblxuXHRcdC8vIEdlbmVyYXRlIG5vbmNlIGZvciBlYWNoIHJlcXVlc3Rcblx0XHRhcHAudXNlKChyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UsIG5leHQ6IE5leHRGdW5jdGlvbikgPT4ge1xuXHRcdFx0cmVzLmxvY2Fscy5jc3BOb25jZSA9IHJhbmRvbUJ5dGVzKDE2KS50b1N0cmluZygnaGV4Jyk7XG5cdFx0XHRuZXh0KCk7XG5cdFx0fSk7XG5cblx0XHQvLyBBcHBseSBDT1JTIG1pZGRsZXdhcmVcblx0XHRhcHAudXNlKFxuXHRcdFx0Y29ycyh7XG5cdFx0XHRcdC8vIG9yaWdpbjogJ2h0dHBzOi8vZ3Vlc3Rib29rLmNvbScsXG5cdFx0XHRcdG1ldGhvZHM6ICdHRVQsUE9TVCxQVVQsREVMRVRFJyxcblx0XHRcdFx0YWxsb3dlZEhlYWRlcnM6ICdDb250ZW50LVR5cGUsQXV0aG9yaXphdGlvbicsIC8vIGFsbG93IHNwZWNpZmljIGhlYWRlcnNcblx0XHRcdFx0Y3JlZGVudGlhbHM6IHRydWUgLy8gYWxsb3cgY29va2llcyB0byBiZSBzZW50XG5cdFx0XHR9KVxuXHRcdCk7XG5cblx0XHQvLyBBcHBseSAnaHBwJyBtaWRkbGV3YXJlIHRvIHNhbml0aXplIHF1ZXJ5IHBhcmFtZXRlcnNcblx0XHRhcHAudXNlKGhwcCgpKTtcblxuXHRcdC8vIEFwcGx5IFNlY3VyaXR5IEhlYWRlcnNcblx0XHRzZXR1cFNlY3VyaXR5SGVhZGVycyhhcHApO1xuXG5cdFx0Ly8gSFRUUCBSZXF1ZXN0IExvZ2dpbmdcblx0XHRhcHAudXNlKFxuXHRcdFx0bW9yZ2FuKCdjb21iaW5lZCcsIHtcblx0XHRcdFx0c3RyZWFtOiB7XG5cdFx0XHRcdFx0d3JpdGU6IChtZXNzYWdlKSA9PiBsb2dnZXIuaW5mbyhtZXNzYWdlLnRyaW0oKSlcblx0XHRcdFx0fVxuXHRcdFx0fSlcblx0XHQpO1xuXG5cdFx0Ly8gSW5pdGlhbGl6ZSBQYXNzcG9ydFxuXHRcdGFwcC51c2UocGFzc3BvcnQuaW5pdGlhbGl6ZSgpKTtcblxuXHRcdC8vIEFkZCBDb29raWUgUGFyc2VyXG5cdFx0YXBwLnVzZShjb29raWVQYXJzZXIoKSk7XG5cblx0XHQvLyBTZXJ2ZSBTdGF0aWMgRmlsZXMgZnJvbSB0aGUgL3B1YmxpYyBEaXJlY3Rvcnlcblx0XHRhcHAudXNlKGV4cHJlc3Muc3RhdGljKHN0YXRpY1Jvb3RQYXRoKSk7XG5cblx0XHQvLyBVc2UgU3RhdGljIFJvdXRlc1xuXHRcdGFwcC51c2UoJy8nLCBpbml0aWFsaXplU3RhdGljUm91dGVzKTtcblxuXHRcdC8vIFVzZSBBUEkgRW91dGVzXG5cdFx0YXBwLnVzZSgnL2FwaScsIGFwaVJvdXRlcyk7XG5cblx0XHQvLyA0MDQgZXJyb3IgaGFuZGxpbmdcblx0XHRhcHAudXNlKChyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UsIG5leHQ6IE5leHRGdW5jdGlvbikgPT4ge1xuXHRcdFx0cmVzLnN0YXR1cyg0MDQpLnNlbmRGaWxlKFxuXHRcdFx0XHRwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vcHVibGljJywgJ25vdC1mb3VuZC5odG1sJylcblx0XHRcdCk7XG5cdFx0XHRuZXh0KCk7XG5cdFx0fSk7XG5cblx0XHQvLyBFcnJvciBIYW5kbGluZyBNaWRkbGV3YXJlXG5cdFx0YXBwLnVzZShcblx0XHRcdChlcnI6IEVycm9yLCByZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UsIG5leHQ6IE5leHRGdW5jdGlvbikgPT4ge1xuXHRcdFx0XHRsb2dnZXIuZXJyb3IoXG5cdFx0XHRcdFx0J0Vycm9yIG9jY3VycmVkOiAnLFxuXHRcdFx0XHRcdGVyci5zdGFjayB8fCBlcnIubWVzc2FnZSB8fCBlcnJcblx0XHRcdFx0KTtcblx0XHRcdFx0cmVzLnN0YXR1cyg1MDApLnNlbmQoXG5cdFx0XHRcdFx0YFNlcnZlciBlcnJvciAtIHNvbWV0aGluZyBmYWlsZWQgJHtlcnIuc3RhY2t9YFxuXHRcdFx0XHQpO1xuXG5cdFx0XHRcdG5leHQoKTtcblx0XHRcdH1cblx0XHQpO1xuXG5cdFx0Ly8gVGVzdCBkYXRhYmFzZSBjb25uZWN0aW9uIGFuZCBzeW5jIG1vZGVsc1xuXHRcdHRyeSB7XG5cdFx0XHRhd2FpdCBzZXF1ZWxpemUuc3luYygpO1xuXHRcdFx0bG9nZ2VyLmluZm8oJ0RhdGFiYXNlIGFuZCB0YWJsZXMgY3JlYXRlZCEnKTtcblx0XHR9IGNhdGNoIChlcnIpIHtcblx0XHRcdGxvZ2dlci5lcnJvcihcblx0XHRcdFx0J0RhdGFiYXNlIENvbm5lY3Rpb24gVGVzdCBhbmQgU3luYzogU2VydmVyIGVycm9yOiAnLFxuXHRcdFx0XHRlcnJcblx0XHRcdCk7XG5cdFx0XHR0aHJvdyBlcnI7XG5cdFx0fVxuXG5cdFx0Ly8gRW5mb3JjZSBIVFRQUyBSZWRpcmVjdHNcblx0XHRsb2dnZXIuaW5mbygnRW5mb3JjaW5nIEhUVFBTIHJlZGlyZWN0cycpO1xuXHRcdGFwcC51c2UoKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSwgbmV4dDogTmV4dEZ1bmN0aW9uKSA9PiB7XG5cdFx0XHQvLyByZWRpcmVjdCBIVFRQIHRvIEhUVFBTXG5cdFx0XHRpZiAocmVxLmhlYWRlcigneC1mb3J3YXJkZWQtcHJvdG8nKSAhPT0gJ2h0dHBzJykge1xuXHRcdFx0XHRyZXMucmVkaXJlY3QoYGh0dHBzOi8vJHtyZXEuaGVhZGVyKCdob3N0Jyl9JHtyZXEudXJsfWApO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0bmV4dCgpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0Ly8gU3RhcnQgdGhlIHNlcnZlciB3aXRoIGVpdGhlciBIVFRQMS4xIG9yIEhUVFAyLCBkZXBlbmRlbnQgb24gZmVhdHVyZSBmbGFnc1xuXHRcdGF3YWl0IHN0YXJ0U2VydmVyKCk7XG5cdH0gY2F0Y2ggKGVycikge1xuXHRcdGxvZ2dlci5lcnJvcignRmFpbGVkIHRvIHN0YXJ0IHNlcnZlcjogJywgZXJyKTtcblx0XHRwcm9jZXNzLmV4aXQoMSk7IC8vIGV4aXQgcHJvY2VzcyB3aXRoIGZhaWx1cmVcblx0fVxufVxuXG5pbml0aWFsaXplU2VydmVyKCk7XG5cbmV4cG9ydCBkZWZhdWx0IGFwcDtcblxuLy8gKkRFVi1OT1RFKiBuZWVkIHRvIGltcGxlbWVudCBzZXNzaW9uIG1hbmFnZW1lbnRcbiJdfQ==
