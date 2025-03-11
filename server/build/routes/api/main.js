// File: server/src/routes/api/main.ts
import { AuthController } from '../../controllers/Auth.js';
import fs from 'fs/promises';
import { dbClientPromise } from '../../db/main.js';
export const registerApiRoutes = (fastify) => {
    fastify.get('/health', async (_, reply) => {
        try {
            const client = await dbClientPromise;
            await client.query('SELECT 1');
            console.log('Database connection is healthy.');
            const backups = await fs.readdir('/db/backups');
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
    fastify.post('/signup', AuthController.signup);
    fastify.post('/signup', AuthController.login);
    fastify.get('/profile', { preHandler: fastify.authenticate }, AuthController.getProfile);
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9yb3V0ZXMvYXBpL21haW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsc0NBQXNDO0FBR3RDLE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSwyQkFBMkIsQ0FBQztBQUMzRCxPQUFPLEVBQUUsTUFBTSxhQUFhLENBQUM7QUFDN0IsT0FBTyxFQUFFLGVBQWUsRUFBRSxNQUFNLGtCQUFrQixDQUFDO0FBRW5ELE1BQU0sQ0FBQyxNQUFNLGlCQUFpQixHQUFHLENBQUMsT0FBd0IsRUFBRSxFQUFFO0lBQzdELE9BQU8sQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsS0FBbUIsRUFBRSxFQUFFO1FBQ3ZELElBQUksQ0FBQztZQUNKLE1BQU0sTUFBTSxHQUFHLE1BQU0sZUFBZSxDQUFDO1lBQ3JDLE1BQU0sTUFBTSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUMvQixPQUFPLENBQUMsR0FBRyxDQUFDLGlDQUFpQyxDQUFDLENBQUM7WUFFL0MsTUFBTSxPQUFPLEdBQUcsTUFBTSxFQUFFLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBQ2hELEtBQUssQ0FBQyxJQUFJLENBQUM7Z0JBQ1YsTUFBTSxFQUFFLElBQUk7Z0JBQ1osRUFBRSxFQUFFLFdBQVc7Z0JBQ2YsT0FBTyxFQUFFLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLFNBQVM7YUFDbkQsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7WUFDZCxPQUFPLENBQUMsS0FBSyxDQUFDLHNCQUFzQixFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQzNDLEtBQUssQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO2dCQUN0QixNQUFNLEVBQUUsT0FBTztnQkFDZixPQUFPLEVBQUUsR0FBRyxZQUFZLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsR0FBRzthQUNqRCxDQUFDLENBQUM7UUFDSixDQUFDO0lBQ0YsQ0FBQyxDQUFDLENBQUM7SUFFSCxPQUFPLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxjQUFjLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDL0MsT0FBTyxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsY0FBYyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzlDLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLEVBQUUsVUFBVSxFQUFFLE9BQU8sQ0FBQyxZQUFZLEVBQUUsRUFBRSxjQUFjLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDMUYsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLy8gRmlsZTogc2VydmVyL3NyYy9yb3V0ZXMvYXBpL21haW4udHNcblxuaW1wb3J0IHsgRmFzdGlmeUluc3RhbmNlLCBGYXN0aWZ5UmVwbHkgfSBmcm9tICdmYXN0aWZ5JztcbmltcG9ydCB7IEF1dGhDb250cm9sbGVyIH0gZnJvbSAnLi4vLi4vY29udHJvbGxlcnMvQXV0aC5qcyc7XG5pbXBvcnQgZnMgZnJvbSAnZnMvcHJvbWlzZXMnO1xuaW1wb3J0IHsgZGJDbGllbnRQcm9taXNlIH0gZnJvbSAnLi4vLi4vZGIvbWFpbi5qcyc7XG5cbmV4cG9ydCBjb25zdCByZWdpc3RlckFwaVJvdXRlcyA9IChmYXN0aWZ5OiBGYXN0aWZ5SW5zdGFuY2UpID0+IHtcblx0ZmFzdGlmeS5nZXQoJy9oZWFsdGgnLCBhc3luYyAoXywgcmVwbHk6IEZhc3RpZnlSZXBseSkgPT4ge1xuXHRcdHRyeSB7XG5cdFx0XHRjb25zdCBjbGllbnQgPSBhd2FpdCBkYkNsaWVudFByb21pc2U7XG5cdFx0XHRhd2FpdCBjbGllbnQucXVlcnkoJ1NFTEVDVCAxJyk7XG5cdFx0XHRjb25zb2xlLmxvZygnRGF0YWJhc2UgY29ubmVjdGlvbiBpcyBoZWFsdGh5LicpO1xuXG5cdFx0XHRjb25zdCBiYWNrdXBzID0gYXdhaXQgZnMucmVhZGRpcignL2RiL2JhY2t1cHMnKTtcblx0XHRcdHJlcGx5LnNlbmQoe1xuXHRcdFx0XHRzdGF0dXM6ICdvaycsXG5cdFx0XHRcdGRiOiAnY29ubmVjdGVkJyxcblx0XHRcdFx0YmFja3VwczogYmFja3Vwcy5sZW5ndGggPiAwID8gJ3ByZXNlbnQnIDogJ21pc3NpbmcnXG5cdFx0XHR9KTtcblx0XHR9IGNhdGNoIChlcnIpIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoJ0hlYWx0aCBjaGVjayBmYWlsZWQ6JywgZXJyKTtcblx0XHRcdHJlcGx5LnN0YXR1cyg1MDApLnNlbmQoe1xuXHRcdFx0XHRzdGF0dXM6ICdlcnJvcicsXG5cdFx0XHRcdG1lc3NhZ2U6IGVyciBpbnN0YW5jZW9mIEVycm9yID8gZXJyLm1lc3NhZ2UgOiBlcnJcblx0XHRcdH0pO1xuXHRcdH1cblx0fSk7XG5cblx0ZmFzdGlmeS5wb3N0KCcvc2lnbnVwJywgQXV0aENvbnRyb2xsZXIuc2lnbnVwKTtcblx0ZmFzdGlmeS5wb3N0KCcvc2lnbnVwJywgQXV0aENvbnRyb2xsZXIubG9naW4pO1xuXHRmYXN0aWZ5LmdldCgnL3Byb2ZpbGUnLCB7IHByZUhhbmRsZXI6IGZhc3RpZnkuYXV0aGVudGljYXRlIH0sIEF1dGhDb250cm9sbGVyLmdldFByb2ZpbGUpO1xufTtcbiJdfQ==