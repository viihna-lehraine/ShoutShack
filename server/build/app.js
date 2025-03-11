import Fastify from 'fastify';
import { registerRoutes } from './routes/index.js';
export const fastify = Fastify({
    logger: {
        transport: {
            level: 'debug',
            options: {
                colorize: true,
                translateTime: 'SYS:standard'
            },
            target: 'pino-pretty'
        }
    }
});
registerRoutes(fastify);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2FwcC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLE9BQU8sTUFBTSxTQUFTLENBQUM7QUFDOUIsT0FBTyxFQUFFLGNBQWMsRUFBRSxNQUFNLG1CQUFtQixDQUFDO0FBRW5ELE1BQU0sQ0FBQyxNQUFNLE9BQU8sR0FBRyxPQUFPLENBQUM7SUFDOUIsTUFBTSxFQUFFO1FBQ1AsU0FBUyxFQUFFO1lBQ1YsS0FBSyxFQUFFLE9BQU87WUFDZCxPQUFPLEVBQUU7Z0JBQ1IsUUFBUSxFQUFFLElBQUk7Z0JBQ2QsYUFBYSxFQUFFLGNBQWM7YUFDN0I7WUFDRCxNQUFNLEVBQUUsYUFBYTtTQUNyQjtLQUNEO0NBQ0QsQ0FBQyxDQUFDO0FBRUgsY0FBYyxDQUFDLE9BQU8sQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IEZhc3RpZnkgZnJvbSAnZmFzdGlmeSc7XG5pbXBvcnQgeyByZWdpc3RlclJvdXRlcyB9IGZyb20gJy4vcm91dGVzL2luZGV4LmpzJztcblxuZXhwb3J0IGNvbnN0IGZhc3RpZnkgPSBGYXN0aWZ5KHtcblx0bG9nZ2VyOiB7XG5cdFx0dHJhbnNwb3J0OiB7XG5cdFx0XHRsZXZlbDogJ2RlYnVnJyxcblx0XHRcdG9wdGlvbnM6IHtcblx0XHRcdFx0Y29sb3JpemU6IHRydWUsXG5cdFx0XHRcdHRyYW5zbGF0ZVRpbWU6ICdTWVM6c3RhbmRhcmQnXG5cdFx0XHR9LFxuXHRcdFx0dGFyZ2V0OiAncGluby1wcmV0dHknXG5cdFx0fVxuXHR9XG59KTtcblxucmVnaXN0ZXJSb3V0ZXMoZmFzdGlmeSk7XG4iXX0=