// File: backend/src/routes/index.ts
import fs from 'fs/promises';
import path from 'path';
import { registerAdminRoutes } from './admin.js';
import { registerApiRoutes } from './api/main.js';
export const registerRoutes = (fastify) => {
    console.debug('Registering routes');
    console.debug('Calling registerApiRoutes');
    registerApiRoutes(fastify);
    registerAdminRoutes(fastify);
    fastify.setNotFoundHandler(async (_request, reply) => {
        try {
            const filePath = path.join('/usr/share/nginx/html', '404.html');
            const content = await fs.readFile(filePath, 'utf-8');
            reply.code(404).type('text/html').send(content);
        }
        catch (err) {
            reply.code(404).send('404 Not Found');
        }
    });
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvcm91dGVzL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLG9DQUFvQztBQUdwQyxPQUFPLEVBQUUsTUFBTSxhQUFhLENBQUM7QUFDN0IsT0FBTyxJQUFJLE1BQU0sTUFBTSxDQUFDO0FBQ3hCLE9BQU8sRUFBRSxtQkFBbUIsRUFBRSxNQUFNLFlBQVksQ0FBQztBQUNqRCxPQUFPLEVBQUUsaUJBQWlCLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFFbEQsTUFBTSxDQUFDLE1BQU0sY0FBYyxHQUFHLENBQUMsT0FBd0IsRUFBRSxFQUFFO0lBQzFELE9BQU8sQ0FBQyxLQUFLLENBQUMsb0JBQW9CLENBQUMsQ0FBQztJQUVwQyxPQUFPLENBQUMsS0FBSyxDQUFDLDJCQUEyQixDQUFDLENBQUM7SUFDM0MsaUJBQWlCLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDM0IsbUJBQW1CLENBQUMsT0FBTyxDQUFDLENBQUM7SUFFN0IsT0FBTyxDQUFDLGtCQUFrQixDQUFDLEtBQUssRUFBRSxRQUF3QixFQUFFLEtBQW1CLEVBQUUsRUFBRTtRQUNsRixJQUFJLENBQUM7WUFDSixNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLHVCQUF1QixFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQ2hFLE1BQU0sT0FBTyxHQUFHLE1BQU0sRUFBRSxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFFckQsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ2pELENBQUM7UUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1lBQ2QsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUM7UUFDdkMsQ0FBQztJQUNGLENBQUMsQ0FBQyxDQUFDO0FBQ0osQ0FBQyxDQUFDIn0=