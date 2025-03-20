// File: backend/src/plugins/security.ts
import fastifyCors from '@fastify/cors';
import helmet from '@fastify/helmet';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifyCompress from '@fastify/compress';
export const securityPlugin = (app) => {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VjdXJpdHkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvcGx1Z2lucy9zZWN1cml0eS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSx3Q0FBd0M7QUFHeEMsT0FBTyxXQUFXLE1BQU0sZUFBZSxDQUFDO0FBQ3hDLE9BQU8sTUFBTSxNQUFNLGlCQUFpQixDQUFDO0FBQ3JDLE9BQU8sZ0JBQWdCLE1BQU0scUJBQXFCLENBQUM7QUFDbkQsT0FBTyxlQUFlLE1BQU0sbUJBQW1CLENBQUM7QUFFaEQsTUFBTSxDQUFDLE1BQU0sY0FBYyxHQUFHLENBQUMsR0FBb0IsRUFBRSxFQUFFO0lBQ3RELFVBQVU7SUFDVixHQUFHLENBQUMsUUFBUSxDQUFDLFdBQVcsRUFBRTtRQUN6QixNQUFNLEVBQUUsQ0FBQyxnQ0FBZ0MsRUFBRSx1QkFBdUIsQ0FBQztRQUNuRSxPQUFPLEVBQUUsQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxRQUFRLENBQUM7UUFDekMsY0FBYyxFQUFFLENBQUMsY0FBYyxFQUFFLGVBQWUsQ0FBQztLQUNqRCxDQUFDLENBQUM7SUFFSCxZQUFZO0lBQ1osR0FBRyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUU7UUFDcEIscUJBQXFCLEVBQUU7WUFDdEIsVUFBVSxFQUFFO2dCQUNYLFVBQVUsRUFBRSxDQUFDLFFBQVEsQ0FBQztnQkFDdEIsU0FBUyxFQUFFLENBQUMsUUFBUSxFQUFFLGlCQUFpQixFQUFFLGtCQUFrQixDQUFDO2dCQUM1RCxRQUFRLEVBQUUsQ0FBQyxRQUFRLEVBQUUsaUJBQWlCLEVBQUUsc0JBQXNCLENBQUM7Z0JBQy9ELE1BQU0sRUFBRSxDQUFDLFFBQVEsRUFBRSxPQUFPLEVBQUUsa0JBQWtCLENBQUM7Z0JBQy9DLE9BQU8sRUFBRSxDQUFDLFFBQVEsRUFBRSxtQkFBbUIsQ0FBQztnQkFDeEMsVUFBVSxFQUFFLENBQUMsUUFBUSxDQUFDO2dCQUN0QixTQUFTLEVBQUUsQ0FBQyxRQUFRLENBQUM7Z0JBQ3JCLHVCQUF1QixFQUFFLEVBQUU7YUFDM0I7U0FDRDtRQUNELGtCQUFrQixFQUFFLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRTtRQUNwQyxVQUFVLEVBQUUsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLEVBQUUsb0JBQW9CO1FBQ3BELGFBQWEsRUFBRSxJQUFJO1FBQ25CLHNDQUFzQztRQUN0Qyx1RkFBdUY7UUFDdkYsNEJBQTRCLEVBQUUsRUFBRSxpQkFBaUIsRUFBRSxNQUFNLEVBQUU7UUFDM0QsY0FBYyxFQUFFLEVBQUUsTUFBTSxFQUFFLGFBQWEsRUFBRTtRQUN6QyxTQUFTLEVBQUUsSUFBSTtLQUNmLENBQUMsQ0FBQztJQUVILG1CQUFtQjtJQUNuQixHQUFHLENBQUMsUUFBUSxDQUFDLGdCQUFnQixFQUFFO1FBQzlCLEdBQUcsRUFBRSxHQUFHLEVBQUUsZUFBZTtRQUN6QixVQUFVLEVBQUUsVUFBVTtRQUN0QixvQkFBb0IsRUFBRSxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsRUFBRTtZQUN2QyxPQUFPO2dCQUNOLFVBQVUsRUFBRSxHQUFHO2dCQUNmLEtBQUssRUFBRSxtQkFBbUI7Z0JBQzFCLE9BQU8sRUFBRSwyQkFBMkIsT0FBTyxDQUFDLEdBQUcsR0FBRyxJQUFJLFdBQVc7YUFDakUsQ0FBQztRQUNILENBQUM7S0FDRCxDQUFDLENBQUM7SUFFSCxpQkFBaUI7SUFDakIsR0FBRyxDQUFDLFFBQVEsQ0FBQyxlQUFlLEVBQUU7UUFDN0IsV0FBVyxFQUFFLHdCQUF3QjtRQUNyQyxNQUFNLEVBQUUsSUFBSTtRQUNaLFNBQVMsRUFBRSxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDO1FBQ3BDLFNBQVMsRUFBRSxJQUFJO0tBQ2YsQ0FBQyxDQUFDO0lBRUgsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFDO0FBQy9DLENBQUMsQ0FBQyJ9