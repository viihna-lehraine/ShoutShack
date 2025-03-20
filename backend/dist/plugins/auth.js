// File: backend/plugins/auth.ts
import argon2 from 'argon2';
import { env } from '../env/load.js';
import fastifySession from '@fastify/session';
import fastifyCookie from '@fastify/cookie';
export const authPlugin = (app) => {
    app.register(fastifyCookie);
    app.register(fastifySession, {
        secret: env.SESSION_SECRET,
        cookie: {
            httpOnly: true,
            secure: env.NODE_ENV === 'prod',
            sameSite: 'lax',
            maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
        },
        saveUninitialized: false
    });
    app.decorate('hashPassword', async (password) => {
        return await argon2.hash(password + env.PEPPER, {
            type: argon2.argon2id,
            memoryCost: env.A2_MEMCOST,
            timeCost: env.A2_TIMECOST,
            parallelism: env.A2_PARALLELISM
        });
    });
    app.decorate('authenticate', async (request, reply) => {
        if (!request.session.user) {
            return reply.code(401).send({ error: 'Unauthorized' });
        }
    });
    console.log('Authentication plugin registered');
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0aC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9wbHVnaW5zL2F1dGgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsZ0NBQWdDO0FBR2hDLE9BQU8sTUFBTSxNQUFNLFFBQVEsQ0FBQztBQUM1QixPQUFPLEVBQUUsR0FBRyxFQUFFLE1BQU0sZ0JBQWdCLENBQUM7QUFFckMsT0FBTyxjQUFjLE1BQU0sa0JBQWtCLENBQUM7QUFDOUMsT0FBTyxhQUFhLE1BQU0saUJBQWlCLENBQUM7QUFFNUMsTUFBTSxDQUFDLE1BQU0sVUFBVSxHQUFHLENBQUMsR0FBb0IsRUFBRSxFQUFFO0lBQ2xELEdBQUcsQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLENBQUM7SUFDNUIsR0FBRyxDQUFDLFFBQVEsQ0FBQyxjQUFjLEVBQUU7UUFDNUIsTUFBTSxFQUFFLEdBQUcsQ0FBQyxjQUFjO1FBQzFCLE1BQU0sRUFBRTtZQUNQLFFBQVEsRUFBRSxJQUFJO1lBQ2QsTUFBTSxFQUFFLEdBQUcsQ0FBQyxRQUFRLEtBQU0sTUFBa0I7WUFDNUMsUUFBUSxFQUFFLEtBQUs7WUFDZixNQUFNLEVBQUUsSUFBSSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQyxTQUFTO1NBQ3pDO1FBQ0QsaUJBQWlCLEVBQUUsS0FBSztLQUN4QixDQUFDLENBQUM7SUFFSCxHQUFHLENBQUMsUUFBUSxDQUFDLGNBQWMsRUFBRSxLQUFLLEVBQUUsUUFBZ0IsRUFBRSxFQUFFO1FBQ3ZELE9BQU8sTUFBTSxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsR0FBRyxHQUFHLENBQUMsTUFBTSxFQUFFO1lBQy9DLElBQUksRUFBRSxNQUFNLENBQUMsUUFBUTtZQUNyQixVQUFVLEVBQUUsR0FBRyxDQUFDLFVBQVU7WUFDMUIsUUFBUSxFQUFFLEdBQUcsQ0FBQyxXQUFXO1lBQ3pCLFdBQVcsRUFBRSxHQUFHLENBQUMsY0FBYztTQUMvQixDQUFDLENBQUM7SUFDSixDQUFDLENBQUMsQ0FBQztJQUVILEdBQUcsQ0FBQyxRQUFRLENBQUMsY0FBYyxFQUFFLEtBQUssRUFBRSxPQUF1QixFQUFFLEtBQW1CLEVBQUUsRUFBRTtRQUNuRixJQUFJLENBQUUsT0FBTyxDQUFDLE9BQW9ELENBQUMsSUFBSSxFQUFFLENBQUM7WUFDekUsT0FBTyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSxjQUFjLEVBQUUsQ0FBQyxDQUFDO1FBQ3hELENBQUM7SUFDRixDQUFDLENBQUMsQ0FBQztJQUVILE9BQU8sQ0FBQyxHQUFHLENBQUMsa0NBQWtDLENBQUMsQ0FBQztBQUNqRCxDQUFDLENBQUMifQ==