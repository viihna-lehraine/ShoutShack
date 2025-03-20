// File: backend/src/routes/api/main.ts
import { AuthController } from '../../controllers/AuthController.js';
export const registerApiRoutes = (fastify) => {
    console.log('Registering API routes...');
    fastify.register(async (instance) => {
        instance.get('/health', async (_, reply) => {
            reply.send({ status: 'ok' });
        });
        instance.post('/signup', AuthController.signup);
        instance.post('/login', AuthController.login);
        instance.get('/verify', AuthController.verify);
        if (instance.hasDecorator('authenticate')) {
            instance.get('/profile', { preHandler: instance.authenticate }, AuthController.getProfile);
        }
        else {
            instance.get('/profile', AuthController.getProfile);
        }
    }, { prefix: String('/api') });
    console.log('Finished registering API routes');
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9yb3V0ZXMvYXBpL21haW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsdUNBQXVDO0FBR3ZDLE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSxxQ0FBcUMsQ0FBQztBQUVyRSxNQUFNLENBQUMsTUFBTSxpQkFBaUIsR0FBRyxDQUFDLE9BQXdCLEVBQUUsRUFBRTtJQUM3RCxPQUFPLENBQUMsR0FBRyxDQUFDLDJCQUEyQixDQUFDLENBQUM7SUFFekMsT0FBTyxDQUFDLFFBQVEsQ0FDZixLQUFLLEVBQUMsUUFBUSxFQUFDLEVBQUU7UUFDaEIsUUFBUSxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsRUFBRTtZQUMxQyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7UUFDOUIsQ0FBQyxDQUFDLENBQUM7UUFFSCxRQUFRLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxjQUFjLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDaEQsUUFBUSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsY0FBYyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzlDLFFBQVEsQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLGNBQWMsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUUvQyxJQUFJLFFBQVEsQ0FBQyxZQUFZLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQztZQUMzQyxRQUFRLENBQUMsR0FBRyxDQUNYLFVBQVUsRUFDVixFQUFFLFVBQVUsRUFBRSxRQUFRLENBQUMsWUFBWSxFQUFFLEVBQ3JDLGNBQWMsQ0FBQyxVQUFVLENBQ3pCLENBQUM7UUFDSCxDQUFDO2FBQU0sQ0FBQztZQUNQLFFBQVEsQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLGNBQWMsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUNyRCxDQUFDO0lBQ0YsQ0FBQyxFQUNELEVBQUUsTUFBTSxFQUFFLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUMxQixDQUFDO0lBRUYsT0FBTyxDQUFDLEdBQUcsQ0FBQyxpQ0FBaUMsQ0FBQyxDQUFDO0FBQ2hELENBQUMsQ0FBQyJ9