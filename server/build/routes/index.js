// File: server/src/routes/index.ts
import fs from 'fs/promises';
import path from 'path';
import { registerApiRoutes } from './api/main.js';
export const registerRoutes = (fastify) => {
    console.debug('Registering routes');
    console.debug('Calling registerApiRoutes');
    registerApiRoutes(fastify);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvcm91dGVzL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLG1DQUFtQztBQUduQyxPQUFPLEVBQUUsTUFBTSxhQUFhLENBQUM7QUFDN0IsT0FBTyxJQUFJLE1BQU0sTUFBTSxDQUFDO0FBQ3hCLE9BQU8sRUFBRSxpQkFBaUIsRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUVsRCxNQUFNLENBQUMsTUFBTSxjQUFjLEdBQUcsQ0FBQyxPQUF3QixFQUFFLEVBQUU7SUFDMUQsT0FBTyxDQUFDLEtBQUssQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO0lBRXBDLE9BQU8sQ0FBQyxLQUFLLENBQUMsMkJBQTJCLENBQUMsQ0FBQztJQUMzQyxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUUzQixPQUFPLENBQUMsa0JBQWtCLENBQUMsS0FBSyxFQUFFLFFBQXdCLEVBQUUsS0FBbUIsRUFBRSxFQUFFO1FBQ2xGLElBQUksQ0FBQztZQUNKLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsdUJBQXVCLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDaEUsTUFBTSxPQUFPLEdBQUcsTUFBTSxFQUFFLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUVyRCxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDakQsQ0FBQztRQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7WUFDZCxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQztRQUN2QyxDQUFDO0lBQ0YsQ0FBQyxDQUFDLENBQUM7QUFDSixDQUFDLENBQUMifQ==