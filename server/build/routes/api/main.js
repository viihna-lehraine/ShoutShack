// File: server/src/routes/api/main.ts
import { AuthController } from '../../controllers/AuthController.js';
import fs from 'fs/promises';
export const registerApiRoutes = (fastify) => {
    fastify.get('/health', async (_, reply) => {
        try {
            console.log('Database connection is healthy.');
            let backups = [];
            try {
                backups = await fs.readdir('/db/backups');
            }
            catch (err) {
                console.error('Failed to read backups directory:', err);
            }
            reply.send({
                status: 'ok',
                db: 'connected',
                backups: backups.length > 0 ? 'present' : 'missing'
            });
        }
        catch (err) {
            console.error('Health check failed:', err);
            reply.status(500).send({
                status: 'error',
                message: err instanceof Error ? err.message : err
            });
        }
    });
    // auth routes
    fastify.post('/signup', AuthController.signup);
    fastify.post('/login', AuthController.login);
    fastify.get('/verify', AuthController.verify);
    if (fastify.hasDecorator('authenticate')) {
        fastify.get('/profile', { preHandler: fastify.authenticate }, AuthController.getProfile);
    }
    else {
        console.warn("Warning: `fastify.authenticate` is not defined! Profile route won't be protected.");
        fastify.get('/profile', AuthController.getProfile);
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9yb3V0ZXMvYXBpL21haW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsc0NBQXNDO0FBR3RDLE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSxxQ0FBcUMsQ0FBQztBQUNyRSxPQUFPLEVBQUUsTUFBTSxhQUFhLENBQUM7QUFFN0IsTUFBTSxDQUFDLE1BQU0saUJBQWlCLEdBQUcsQ0FBQyxPQUF3QixFQUFFLEVBQUU7SUFDN0QsT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxLQUFtQixFQUFFLEVBQUU7UUFDdkQsSUFBSSxDQUFDO1lBQ0osT0FBTyxDQUFDLEdBQUcsQ0FBQyxpQ0FBaUMsQ0FBQyxDQUFDO1lBRS9DLElBQUksT0FBTyxHQUFHLEVBQUUsQ0FBQztZQUNqQixJQUFJLENBQUM7Z0JBQ0osT0FBTyxHQUFHLE1BQU0sRUFBRSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUMzQyxDQUFDO1lBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztnQkFDZCxPQUFPLENBQUMsS0FBSyxDQUFDLG1DQUFtQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQ3pELENBQUM7WUFFRCxLQUFLLENBQUMsSUFBSSxDQUFDO2dCQUNWLE1BQU0sRUFBRSxJQUFJO2dCQUNaLEVBQUUsRUFBRSxXQUFXO2dCQUNmLE9BQU8sRUFBRSxPQUFPLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxTQUFTO2FBQ25ELENBQUMsQ0FBQztRQUNKLENBQUM7UUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1lBQ2QsT0FBTyxDQUFDLEtBQUssQ0FBQyxzQkFBc0IsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUMzQyxLQUFLLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFDdEIsTUFBTSxFQUFFLE9BQU87Z0JBQ2YsT0FBTyxFQUFFLEdBQUcsWUFBWSxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEdBQUc7YUFDakQsQ0FBQyxDQUFDO1FBQ0osQ0FBQztJQUNGLENBQUMsQ0FBQyxDQUFDO0lBRUgsY0FBYztJQUNkLE9BQU8sQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLGNBQWMsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUMvQyxPQUFPLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDN0MsT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsY0FBYyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBRTlDLElBQUksT0FBTyxDQUFDLFlBQVksQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDO1FBQzFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLEVBQUUsVUFBVSxFQUFFLE9BQU8sQ0FBQyxZQUFZLEVBQUUsRUFBRSxjQUFjLENBQUMsVUFBVSxDQUFDLENBQUM7SUFDMUYsQ0FBQztTQUFNLENBQUM7UUFDUCxPQUFPLENBQUMsSUFBSSxDQUNYLG1GQUFtRixDQUNuRixDQUFDO1FBQ0YsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUUsY0FBYyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQ3BELENBQUM7QUFDRixDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBGaWxlOiBzZXJ2ZXIvc3JjL3JvdXRlcy9hcGkvbWFpbi50c1xuXG5pbXBvcnQgeyBGYXN0aWZ5SW5zdGFuY2UsIEZhc3RpZnlSZXBseSB9IGZyb20gJ2Zhc3RpZnknO1xuaW1wb3J0IHsgQXV0aENvbnRyb2xsZXIgfSBmcm9tICcuLi8uLi9jb250cm9sbGVycy9BdXRoQ29udHJvbGxlci5qcyc7XG5pbXBvcnQgZnMgZnJvbSAnZnMvcHJvbWlzZXMnO1xuXG5leHBvcnQgY29uc3QgcmVnaXN0ZXJBcGlSb3V0ZXMgPSAoZmFzdGlmeTogRmFzdGlmeUluc3RhbmNlKSA9PiB7XG5cdGZhc3RpZnkuZ2V0KCcvaGVhbHRoJywgYXN5bmMgKF8sIHJlcGx5OiBGYXN0aWZ5UmVwbHkpID0+IHtcblx0XHR0cnkge1xuXHRcdFx0Y29uc29sZS5sb2coJ0RhdGFiYXNlIGNvbm5lY3Rpb24gaXMgaGVhbHRoeS4nKTtcblxuXHRcdFx0bGV0IGJhY2t1cHMgPSBbXTtcblx0XHRcdHRyeSB7XG5cdFx0XHRcdGJhY2t1cHMgPSBhd2FpdCBmcy5yZWFkZGlyKCcvZGIvYmFja3VwcycpO1xuXHRcdFx0fSBjYXRjaCAoZXJyKSB7XG5cdFx0XHRcdGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byByZWFkIGJhY2t1cHMgZGlyZWN0b3J5OicsIGVycik7XG5cdFx0XHR9XG5cblx0XHRcdHJlcGx5LnNlbmQoe1xuXHRcdFx0XHRzdGF0dXM6ICdvaycsXG5cdFx0XHRcdGRiOiAnY29ubmVjdGVkJyxcblx0XHRcdFx0YmFja3VwczogYmFja3Vwcy5sZW5ndGggPiAwID8gJ3ByZXNlbnQnIDogJ21pc3NpbmcnXG5cdFx0XHR9KTtcblx0XHR9IGNhdGNoIChlcnIpIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoJ0hlYWx0aCBjaGVjayBmYWlsZWQ6JywgZXJyKTtcblx0XHRcdHJlcGx5LnN0YXR1cyg1MDApLnNlbmQoe1xuXHRcdFx0XHRzdGF0dXM6ICdlcnJvcicsXG5cdFx0XHRcdG1lc3NhZ2U6IGVyciBpbnN0YW5jZW9mIEVycm9yID8gZXJyLm1lc3NhZ2UgOiBlcnJcblx0XHRcdH0pO1xuXHRcdH1cblx0fSk7XG5cblx0Ly8gYXV0aCByb3V0ZXNcblx0ZmFzdGlmeS5wb3N0KCcvc2lnbnVwJywgQXV0aENvbnRyb2xsZXIuc2lnbnVwKTtcblx0ZmFzdGlmeS5wb3N0KCcvbG9naW4nLCBBdXRoQ29udHJvbGxlci5sb2dpbik7XG5cdGZhc3RpZnkuZ2V0KCcvdmVyaWZ5JywgQXV0aENvbnRyb2xsZXIudmVyaWZ5KTtcblxuXHRpZiAoZmFzdGlmeS5oYXNEZWNvcmF0b3IoJ2F1dGhlbnRpY2F0ZScpKSB7XG5cdFx0ZmFzdGlmeS5nZXQoJy9wcm9maWxlJywgeyBwcmVIYW5kbGVyOiBmYXN0aWZ5LmF1dGhlbnRpY2F0ZSB9LCBBdXRoQ29udHJvbGxlci5nZXRQcm9maWxlKTtcblx0fSBlbHNlIHtcblx0XHRjb25zb2xlLndhcm4oXG5cdFx0XHRcIldhcm5pbmc6IGBmYXN0aWZ5LmF1dGhlbnRpY2F0ZWAgaXMgbm90IGRlZmluZWQhIFByb2ZpbGUgcm91dGUgd29uJ3QgYmUgcHJvdGVjdGVkLlwiXG5cdFx0KTtcblx0XHRmYXN0aWZ5LmdldCgnL3Byb2ZpbGUnLCBBdXRoQ29udHJvbGxlci5nZXRQcm9maWxlKTtcblx0fVxufTtcbiJdfQ==