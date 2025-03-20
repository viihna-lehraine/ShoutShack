// File: backend/src/routes/api/admin.ts
import { adminAuthMiddleware, verifyAdminPassword } from '../plugins/admin.js';
export const registerAdminRoutes = (fastify) => {
    console.log('Registering admin routes...');
    fastify.register(async (instance) => {
        instance.post('/login', async (request, reply) => {
            const { password } = request.body;
            if (!password) {
                return reply.status(400).send({ error: 'Password required' });
            }
            const isValid = await verifyAdminPassword(password);
            if (!isValid) {
                return reply.status(401).send({ error: 'Invalid admin password' });
            }
            request.session.isAdmin = true;
            return reply.send({ message: 'Admin login successful' });
        });
        instance.post('/logout', async (request, reply) => {
            request.session.destroy();
            return reply.send({ message: 'Logged out successfully' });
        });
        instance.addHook('preHandler', adminAuthMiddleware);
        instance.get('/dashboard', async (_, reply) => {
            return reply.send({ message: 'Welcome, Admin!' });
        });
    }, { prefix: '/admin' });
    console.log('Finished registering Admin routes');
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWRtaW4uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvcm91dGVzL2FkbWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLHdDQUF3QztBQUd4QyxPQUFPLEVBQUUsbUJBQW1CLEVBQUUsbUJBQW1CLEVBQUUsTUFBTSxxQkFBcUIsQ0FBQztBQUUvRSxNQUFNLENBQUMsTUFBTSxtQkFBbUIsR0FBRyxDQUFDLE9BQXdCLEVBQUUsRUFBRTtJQUMvRCxPQUFPLENBQUMsR0FBRyxDQUFDLDZCQUE2QixDQUFDLENBQUM7SUFFM0MsT0FBTyxDQUFDLFFBQVEsQ0FDZixLQUFLLEVBQUMsUUFBUSxFQUFDLEVBQUU7UUFDaEIsUUFBUSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsRUFBRTtZQUNoRCxNQUFNLEVBQUUsUUFBUSxFQUFFLEdBQUcsT0FBTyxDQUFDLElBQTRCLENBQUM7WUFFMUQsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUNmLE9BQU8sS0FBSyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLEVBQUUsbUJBQW1CLEVBQUUsQ0FBQyxDQUFDO1lBQy9ELENBQUM7WUFFRCxNQUFNLE9BQU8sR0FBRyxNQUFNLG1CQUFtQixDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBRXBELElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDZCxPQUFPLEtBQUssQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxFQUFFLHdCQUF3QixFQUFFLENBQUMsQ0FBQztZQUNwRSxDQUFDO1lBRUEsT0FBTyxDQUFDLE9BQWlDLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztZQUMxRCxPQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxPQUFPLEVBQUUsd0JBQXdCLEVBQUUsQ0FBQyxDQUFDO1FBQzFELENBQUMsQ0FBQyxDQUFDO1FBRUgsUUFBUSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsRUFBRTtZQUNqRCxPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQzFCLE9BQU8sS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLE9BQU8sRUFBRSx5QkFBeUIsRUFBRSxDQUFDLENBQUM7UUFDM0QsQ0FBQyxDQUFDLENBQUM7UUFFSCxRQUFRLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO1FBRXBELFFBQVEsQ0FBQyxHQUFHLENBQUMsWUFBWSxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLEVBQUU7WUFDN0MsT0FBTyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsT0FBTyxFQUFFLGlCQUFpQixFQUFFLENBQUMsQ0FBQztRQUNuRCxDQUFDLENBQUMsQ0FBQztJQUNKLENBQUMsRUFDRCxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsQ0FDcEIsQ0FBQztJQUVGLE9BQU8sQ0FBQyxHQUFHLENBQUMsbUNBQW1DLENBQUMsQ0FBQztBQUNsRCxDQUFDLENBQUMifQ==