// File: server/src/middleware/security.ts
import fastifyCors from '@fastify/cors';
import helmet from '@fastify/helmet';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifyCompress from '@fastify/compress';
export const registerSecurityPlugin = (app) => {
    // 1. CORS
    app.register(fastifyCors, {
        origin: ['https://shoutshack.example.com', 'http://localhost:5173'],
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization']
    });
    // 2. Helmet
    app.register(helmet, {
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net'],
                styleSrc: ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
                imgSrc: ["'self'", 'data:', 'cdn.jsdelivr.net'],
                fontSrc: ["'self'", 'fonts.gstatic.com'],
                connectSrc: ["'self'"],
                objectSrc: ["'none'"],
                upgradeInsecureRequests: []
            }
        },
        dnsPrefetchControl: { allow: false },
        frameguard: { action: 'deny' }, // anti-clickjacking
        hidePoweredBy: true,
        // TODO: turn this on when HTTPS works
        // hsts: { maxAge: 31536000, includeSubDomains: true, preload: true }, // enforce HTTPS
        permittedCrossDomainPolicies: { permittedPolicies: 'none' },
        referrerPolicy: { policy: 'no-referrer' },
        xssFilter: true
    });
    // 3. Rate Limiting
    app.register(fastifyRateLimit, {
        max: 100, // 100 requests
        timeWindow: '1 minute',
        errorResponseBuilder: (_req, context) => {
            return {
                statusCode: 429,
                error: 'Too Many Requests',
                message: `Calm down! Try again in ${context.ttl / 1000} seconds.`
            };
        }
    });
    // 4. Compression
    app.register(fastifyCompress, {
        customTypes: /^text\/|\+json$|\+xml$/,
        global: true,
        encodings: ['gzip', 'deflate', 'br'],
        threshold: 1024
    });
    console.log('Security middleware registered');
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VjdXJpdHkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvcGx1Z2lucy9zZWN1cml0eS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwQ0FBMEM7QUFHMUMsT0FBTyxXQUFXLE1BQU0sZUFBZSxDQUFDO0FBQ3hDLE9BQU8sTUFBTSxNQUFNLGlCQUFpQixDQUFDO0FBQ3JDLE9BQU8sZ0JBQWdCLE1BQU0scUJBQXFCLENBQUM7QUFDbkQsT0FBTyxlQUFlLE1BQU0sbUJBQW1CLENBQUM7QUFFaEQsTUFBTSxDQUFDLE1BQU0sc0JBQXNCLEdBQUcsQ0FBQyxHQUFvQixFQUFFLEVBQUU7SUFDOUQsVUFBVTtJQUNWLEdBQUcsQ0FBQyxRQUFRLENBQUMsV0FBVyxFQUFFO1FBQ3pCLE1BQU0sRUFBRSxDQUFDLGdDQUFnQyxFQUFFLHVCQUF1QixDQUFDO1FBQ25FLE9BQU8sRUFBRSxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLFFBQVEsQ0FBQztRQUN6QyxjQUFjLEVBQUUsQ0FBQyxjQUFjLEVBQUUsZUFBZSxDQUFDO0tBQ2pELENBQUMsQ0FBQztJQUVILFlBQVk7SUFDWixHQUFHLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRTtRQUNwQixxQkFBcUIsRUFBRTtZQUN0QixVQUFVLEVBQUU7Z0JBQ1gsVUFBVSxFQUFFLENBQUMsUUFBUSxDQUFDO2dCQUN0QixTQUFTLEVBQUUsQ0FBQyxRQUFRLEVBQUUsaUJBQWlCLEVBQUUsa0JBQWtCLENBQUM7Z0JBQzVELFFBQVEsRUFBRSxDQUFDLFFBQVEsRUFBRSxpQkFBaUIsRUFBRSxzQkFBc0IsQ0FBQztnQkFDL0QsTUFBTSxFQUFFLENBQUMsUUFBUSxFQUFFLE9BQU8sRUFBRSxrQkFBa0IsQ0FBQztnQkFDL0MsT0FBTyxFQUFFLENBQUMsUUFBUSxFQUFFLG1CQUFtQixDQUFDO2dCQUN4QyxVQUFVLEVBQUUsQ0FBQyxRQUFRLENBQUM7Z0JBQ3RCLFNBQVMsRUFBRSxDQUFDLFFBQVEsQ0FBQztnQkFDckIsdUJBQXVCLEVBQUUsRUFBRTthQUMzQjtTQUNEO1FBQ0Qsa0JBQWtCLEVBQUUsRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFO1FBQ3BDLFVBQVUsRUFBRSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsRUFBRSxvQkFBb0I7UUFDcEQsYUFBYSxFQUFFLElBQUk7UUFDbkIsc0NBQXNDO1FBQ3RDLHVGQUF1RjtRQUN2Riw0QkFBNEIsRUFBRSxFQUFFLGlCQUFpQixFQUFFLE1BQU0sRUFBRTtRQUMzRCxjQUFjLEVBQUUsRUFBRSxNQUFNLEVBQUUsYUFBYSxFQUFFO1FBQ3pDLFNBQVMsRUFBRSxJQUFJO0tBQ2YsQ0FBQyxDQUFDO0lBRUgsbUJBQW1CO0lBQ25CLEdBQUcsQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLEVBQUU7UUFDOUIsR0FBRyxFQUFFLEdBQUcsRUFBRSxlQUFlO1FBQ3pCLFVBQVUsRUFBRSxVQUFVO1FBQ3RCLG9CQUFvQixFQUFFLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSxFQUFFO1lBQ3ZDLE9BQU87Z0JBQ04sVUFBVSxFQUFFLEdBQUc7Z0JBQ2YsS0FBSyxFQUFFLG1CQUFtQjtnQkFDMUIsT0FBTyxFQUFFLDJCQUEyQixPQUFPLENBQUMsR0FBRyxHQUFHLElBQUksV0FBVzthQUNqRSxDQUFDO1FBQ0gsQ0FBQztLQUNELENBQUMsQ0FBQztJQUVILGlCQUFpQjtJQUNqQixHQUFHLENBQUMsUUFBUSxDQUFDLGVBQWUsRUFBRTtRQUM3QixXQUFXLEVBQUUsd0JBQXdCO1FBQ3JDLE1BQU0sRUFBRSxJQUFJO1FBQ1osU0FBUyxFQUFFLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUM7UUFDcEMsU0FBUyxFQUFFLElBQUk7S0FDZixDQUFDLENBQUM7SUFFSCxPQUFPLENBQUMsR0FBRyxDQUFDLGdDQUFnQyxDQUFDLENBQUM7QUFDL0MsQ0FBQyxDQUFDIn0=