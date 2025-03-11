// File: server/src/config/security.ts
import fastifyCors from '@fastify/cors';
import helmet from '@fastify/helmet';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifyCompress from '@fastify/compress';
export const registerSecurityMiddleware = (app) => {
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
                connectSrc: ["'self'"]
            }
        },
        frameguard: { action: 'deny' }, // anti-clickjacking
        // TODO: turn this on when HTTPS works
        // hsts: { maxAge: 31536000, includeSubDomains: true, preload: true }, // enforce HTTPS
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
    app.register(fastifyCompress, { global: true });
    console.log('✅ Security middleware registered');
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VjdXJpdHkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvY29uZmlnL3NlY3VyaXR5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLHNDQUFzQztBQUd0QyxPQUFPLFdBQVcsTUFBTSxlQUFlLENBQUM7QUFDeEMsT0FBTyxNQUFNLE1BQU0saUJBQWlCLENBQUM7QUFDckMsT0FBTyxnQkFBZ0IsTUFBTSxxQkFBcUIsQ0FBQztBQUNuRCxPQUFPLGVBQWUsTUFBTSxtQkFBbUIsQ0FBQztBQUVoRCxNQUFNLENBQUMsTUFBTSwwQkFBMEIsR0FBRyxDQUFDLEdBQW9CLEVBQUUsRUFBRTtJQUNsRSxVQUFVO0lBQ1YsR0FBRyxDQUFDLFFBQVEsQ0FBQyxXQUFXLEVBQUU7UUFDekIsTUFBTSxFQUFFLENBQUMsZ0NBQWdDLEVBQUUsdUJBQXVCLENBQUM7UUFDbkUsT0FBTyxFQUFFLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsUUFBUSxDQUFDO1FBQ3pDLGNBQWMsRUFBRSxDQUFDLGNBQWMsRUFBRSxlQUFlLENBQUM7S0FDakQsQ0FBQyxDQUFDO0lBRUgsWUFBWTtJQUNaLEdBQUcsQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFO1FBQ3BCLHFCQUFxQixFQUFFO1lBQ3RCLFVBQVUsRUFBRTtnQkFDWCxVQUFVLEVBQUUsQ0FBQyxRQUFRLENBQUM7Z0JBQ3RCLFNBQVMsRUFBRSxDQUFDLFFBQVEsRUFBRSxpQkFBaUIsRUFBRSxrQkFBa0IsQ0FBQztnQkFDNUQsUUFBUSxFQUFFLENBQUMsUUFBUSxFQUFFLGlCQUFpQixFQUFFLHNCQUFzQixDQUFDO2dCQUMvRCxNQUFNLEVBQUUsQ0FBQyxRQUFRLEVBQUUsT0FBTyxFQUFFLGtCQUFrQixDQUFDO2dCQUMvQyxPQUFPLEVBQUUsQ0FBQyxRQUFRLEVBQUUsbUJBQW1CLENBQUM7Z0JBQ3hDLFVBQVUsRUFBRSxDQUFDLFFBQVEsQ0FBQzthQUN0QjtTQUNEO1FBQ0QsVUFBVSxFQUFFLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxFQUFFLG9CQUFvQjtRQUNwRCxzQ0FBc0M7UUFDdEMsdUZBQXVGO1FBQ3ZGLFNBQVMsRUFBRSxJQUFJO0tBQ2YsQ0FBQyxDQUFDO0lBRUgsbUJBQW1CO0lBQ25CLEdBQUcsQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLEVBQUU7UUFDOUIsR0FBRyxFQUFFLEdBQUcsRUFBRSxlQUFlO1FBQ3pCLFVBQVUsRUFBRSxVQUFVO1FBQ3RCLG9CQUFvQixFQUFFLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSxFQUFFO1lBQ3ZDLE9BQU87Z0JBQ04sVUFBVSxFQUFFLEdBQUc7Z0JBQ2YsS0FBSyxFQUFFLG1CQUFtQjtnQkFDMUIsT0FBTyxFQUFFLDJCQUEyQixPQUFPLENBQUMsR0FBRyxHQUFHLElBQUksV0FBVzthQUNqRSxDQUFDO1FBQ0gsQ0FBQztLQUNELENBQUMsQ0FBQztJQUVILGlCQUFpQjtJQUNqQixHQUFHLENBQUMsUUFBUSxDQUFDLGVBQWUsRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO0lBRWhELE9BQU8sQ0FBQyxHQUFHLENBQUMsa0NBQWtDLENBQUMsQ0FBQztBQUNqRCxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBGaWxlOiBzZXJ2ZXIvc3JjL2NvbmZpZy9zZWN1cml0eS50c1xuXG5pbXBvcnQgeyBGYXN0aWZ5SW5zdGFuY2UgfSBmcm9tICdmYXN0aWZ5JztcbmltcG9ydCBmYXN0aWZ5Q29ycyBmcm9tICdAZmFzdGlmeS9jb3JzJztcbmltcG9ydCBoZWxtZXQgZnJvbSAnQGZhc3RpZnkvaGVsbWV0JztcbmltcG9ydCBmYXN0aWZ5UmF0ZUxpbWl0IGZyb20gJ0BmYXN0aWZ5L3JhdGUtbGltaXQnO1xuaW1wb3J0IGZhc3RpZnlDb21wcmVzcyBmcm9tICdAZmFzdGlmeS9jb21wcmVzcyc7XG5cbmV4cG9ydCBjb25zdCByZWdpc3RlclNlY3VyaXR5TWlkZGxld2FyZSA9IChhcHA6IEZhc3RpZnlJbnN0YW5jZSkgPT4ge1xuXHQvLyAxLiBDT1JTXG5cdGFwcC5yZWdpc3RlcihmYXN0aWZ5Q29ycywge1xuXHRcdG9yaWdpbjogWydodHRwczovL3Nob3V0c2hhY2suZXhhbXBsZS5jb20nLCAnaHR0cDovL2xvY2FsaG9zdDo1MTczJ10sXG5cdFx0bWV0aG9kczogWydHRVQnLCAnUE9TVCcsICdQVVQnLCAnREVMRVRFJ10sXG5cdFx0YWxsb3dlZEhlYWRlcnM6IFsnQ29udGVudC1UeXBlJywgJ0F1dGhvcml6YXRpb24nXVxuXHR9KTtcblxuXHQvLyAyLiBIZWxtZXRcblx0YXBwLnJlZ2lzdGVyKGhlbG1ldCwge1xuXHRcdGNvbnRlbnRTZWN1cml0eVBvbGljeToge1xuXHRcdFx0ZGlyZWN0aXZlczoge1xuXHRcdFx0XHRkZWZhdWx0U3JjOiBbXCInc2VsZidcIl0sXG5cdFx0XHRcdHNjcmlwdFNyYzogW1wiJ3NlbGYnXCIsIFwiJ3Vuc2FmZS1pbmxpbmUnXCIsICdjZG4uanNkZWxpdnIubmV0J10sXG5cdFx0XHRcdHN0eWxlU3JjOiBbXCInc2VsZidcIiwgXCIndW5zYWZlLWlubGluZSdcIiwgJ2ZvbnRzLmdvb2dsZWFwaXMuY29tJ10sXG5cdFx0XHRcdGltZ1NyYzogW1wiJ3NlbGYnXCIsICdkYXRhOicsICdjZG4uanNkZWxpdnIubmV0J10sXG5cdFx0XHRcdGZvbnRTcmM6IFtcIidzZWxmJ1wiLCAnZm9udHMuZ3N0YXRpYy5jb20nXSxcblx0XHRcdFx0Y29ubmVjdFNyYzogW1wiJ3NlbGYnXCJdXG5cdFx0XHR9XG5cdFx0fSxcblx0XHRmcmFtZWd1YXJkOiB7IGFjdGlvbjogJ2RlbnknIH0sIC8vIGFudGktY2xpY2tqYWNraW5nXG5cdFx0Ly8gVE9ETzogdHVybiB0aGlzIG9uIHdoZW4gSFRUUFMgd29ya3Ncblx0XHQvLyBoc3RzOiB7IG1heEFnZTogMzE1MzYwMDAsIGluY2x1ZGVTdWJEb21haW5zOiB0cnVlLCBwcmVsb2FkOiB0cnVlIH0sIC8vIGVuZm9yY2UgSFRUUFNcblx0XHR4c3NGaWx0ZXI6IHRydWVcblx0fSk7XG5cblx0Ly8gMy4gUmF0ZSBMaW1pdGluZ1xuXHRhcHAucmVnaXN0ZXIoZmFzdGlmeVJhdGVMaW1pdCwge1xuXHRcdG1heDogMTAwLCAvLyAxMDAgcmVxdWVzdHNcblx0XHR0aW1lV2luZG93OiAnMSBtaW51dGUnLFxuXHRcdGVycm9yUmVzcG9uc2VCdWlsZGVyOiAoX3JlcSwgY29udGV4dCkgPT4ge1xuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0c3RhdHVzQ29kZTogNDI5LFxuXHRcdFx0XHRlcnJvcjogJ1RvbyBNYW55IFJlcXVlc3RzJyxcblx0XHRcdFx0bWVzc2FnZTogYENhbG0gZG93biEgVHJ5IGFnYWluIGluICR7Y29udGV4dC50dGwgLyAxMDAwfSBzZWNvbmRzLmBcblx0XHRcdH07XG5cdFx0fVxuXHR9KTtcblxuXHQvLyA0LiBDb21wcmVzc2lvblxuXHRhcHAucmVnaXN0ZXIoZmFzdGlmeUNvbXByZXNzLCB7IGdsb2JhbDogdHJ1ZSB9KTtcblxuXHRjb25zb2xlLmxvZygn4pyFIFNlY3VyaXR5IG1pZGRsZXdhcmUgcmVnaXN0ZXJlZCcpO1xufTtcbiJdfQ==