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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VjdXJpdHkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvY29uZmlnL3NlY3VyaXR5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLHNDQUFzQztBQUd0QyxPQUFPLFdBQVcsTUFBTSxlQUFlLENBQUM7QUFDeEMsT0FBTyxNQUFNLE1BQU0saUJBQWlCLENBQUM7QUFDckMsT0FBTyxnQkFBZ0IsTUFBTSxxQkFBcUIsQ0FBQztBQUNuRCxPQUFPLGVBQWUsTUFBTSxtQkFBbUIsQ0FBQztBQUVoRCxNQUFNLENBQUMsTUFBTSwwQkFBMEIsR0FBRyxDQUFDLEdBQW9CLEVBQUUsRUFBRTtJQUNsRSxVQUFVO0lBQ1YsR0FBRyxDQUFDLFFBQVEsQ0FBQyxXQUFXLEVBQUU7UUFDekIsTUFBTSxFQUFFLENBQUMsZ0NBQWdDLEVBQUUsdUJBQXVCLENBQUM7UUFDbkUsT0FBTyxFQUFFLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsUUFBUSxDQUFDO1FBQ3pDLGNBQWMsRUFBRSxDQUFDLGNBQWMsRUFBRSxlQUFlLENBQUM7S0FDakQsQ0FBQyxDQUFDO0lBRUgsWUFBWTtJQUNaLEdBQUcsQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFO1FBQ3BCLHFCQUFxQixFQUFFO1lBQ3RCLFVBQVUsRUFBRTtnQkFDWCxVQUFVLEVBQUUsQ0FBQyxRQUFRLENBQUM7Z0JBQ3RCLFNBQVMsRUFBRSxDQUFDLFFBQVEsRUFBRSxpQkFBaUIsRUFBRSxrQkFBa0IsQ0FBQztnQkFDNUQsUUFBUSxFQUFFLENBQUMsUUFBUSxFQUFFLGlCQUFpQixFQUFFLHNCQUFzQixDQUFDO2dCQUMvRCxNQUFNLEVBQUUsQ0FBQyxRQUFRLEVBQUUsT0FBTyxFQUFFLGtCQUFrQixDQUFDO2dCQUMvQyxPQUFPLEVBQUUsQ0FBQyxRQUFRLEVBQUUsbUJBQW1CLENBQUM7Z0JBQ3hDLFVBQVUsRUFBRSxDQUFDLFFBQVEsQ0FBQztnQkFDdEIsU0FBUyxFQUFFLENBQUMsUUFBUSxDQUFDO2dCQUNyQix1QkFBdUIsRUFBRSxFQUFFO2FBQzNCO1NBQ0Q7UUFDRCxrQkFBa0IsRUFBRSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUU7UUFDcEMsVUFBVSxFQUFFLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxFQUFFLG9CQUFvQjtRQUNwRCxhQUFhLEVBQUUsSUFBSTtRQUNuQixzQ0FBc0M7UUFDdEMsdUZBQXVGO1FBQ3ZGLDRCQUE0QixFQUFFLEVBQUUsaUJBQWlCLEVBQUUsTUFBTSxFQUFFO1FBQzNELGNBQWMsRUFBRSxFQUFFLE1BQU0sRUFBRSxhQUFhLEVBQUU7UUFDekMsU0FBUyxFQUFFLElBQUk7S0FDZixDQUFDLENBQUM7SUFFSCxtQkFBbUI7SUFDbkIsR0FBRyxDQUFDLFFBQVEsQ0FBQyxnQkFBZ0IsRUFBRTtRQUM5QixHQUFHLEVBQUUsR0FBRyxFQUFFLGVBQWU7UUFDekIsVUFBVSxFQUFFLFVBQVU7UUFDdEIsb0JBQW9CLEVBQUUsQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFLEVBQUU7WUFDdkMsT0FBTztnQkFDTixVQUFVLEVBQUUsR0FBRztnQkFDZixLQUFLLEVBQUUsbUJBQW1CO2dCQUMxQixPQUFPLEVBQUUsMkJBQTJCLE9BQU8sQ0FBQyxHQUFHLEdBQUcsSUFBSSxXQUFXO2FBQ2pFLENBQUM7UUFDSCxDQUFDO0tBQ0QsQ0FBQyxDQUFDO0lBRUgsaUJBQWlCO0lBQ2pCLEdBQUcsQ0FBQyxRQUFRLENBQUMsZUFBZSxFQUFFO1FBQzdCLFdBQVcsRUFBRSx3QkFBd0I7UUFDckMsTUFBTSxFQUFFLElBQUk7UUFDWixTQUFTLEVBQUUsQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQztRQUNwQyxTQUFTLEVBQUUsSUFBSTtLQUNmLENBQUMsQ0FBQztJQUVILE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0NBQWdDLENBQUMsQ0FBQztBQUMvQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBGaWxlOiBzZXJ2ZXIvc3JjL2NvbmZpZy9zZWN1cml0eS50c1xuXG5pbXBvcnQgeyBGYXN0aWZ5SW5zdGFuY2UgfSBmcm9tICdmYXN0aWZ5JztcbmltcG9ydCBmYXN0aWZ5Q29ycyBmcm9tICdAZmFzdGlmeS9jb3JzJztcbmltcG9ydCBoZWxtZXQgZnJvbSAnQGZhc3RpZnkvaGVsbWV0JztcbmltcG9ydCBmYXN0aWZ5UmF0ZUxpbWl0IGZyb20gJ0BmYXN0aWZ5L3JhdGUtbGltaXQnO1xuaW1wb3J0IGZhc3RpZnlDb21wcmVzcyBmcm9tICdAZmFzdGlmeS9jb21wcmVzcyc7XG5cbmV4cG9ydCBjb25zdCByZWdpc3RlclNlY3VyaXR5TWlkZGxld2FyZSA9IChhcHA6IEZhc3RpZnlJbnN0YW5jZSkgPT4ge1xuXHQvLyAxLiBDT1JTXG5cdGFwcC5yZWdpc3RlcihmYXN0aWZ5Q29ycywge1xuXHRcdG9yaWdpbjogWydodHRwczovL3Nob3V0c2hhY2suZXhhbXBsZS5jb20nLCAnaHR0cDovL2xvY2FsaG9zdDo1MTczJ10sXG5cdFx0bWV0aG9kczogWydHRVQnLCAnUE9TVCcsICdQVVQnLCAnREVMRVRFJ10sXG5cdFx0YWxsb3dlZEhlYWRlcnM6IFsnQ29udGVudC1UeXBlJywgJ0F1dGhvcml6YXRpb24nXVxuXHR9KTtcblxuXHQvLyAyLiBIZWxtZXRcblx0YXBwLnJlZ2lzdGVyKGhlbG1ldCwge1xuXHRcdGNvbnRlbnRTZWN1cml0eVBvbGljeToge1xuXHRcdFx0ZGlyZWN0aXZlczoge1xuXHRcdFx0XHRkZWZhdWx0U3JjOiBbXCInc2VsZidcIl0sXG5cdFx0XHRcdHNjcmlwdFNyYzogW1wiJ3NlbGYnXCIsIFwiJ3Vuc2FmZS1pbmxpbmUnXCIsICdjZG4uanNkZWxpdnIubmV0J10sXG5cdFx0XHRcdHN0eWxlU3JjOiBbXCInc2VsZidcIiwgXCIndW5zYWZlLWlubGluZSdcIiwgJ2ZvbnRzLmdvb2dsZWFwaXMuY29tJ10sXG5cdFx0XHRcdGltZ1NyYzogW1wiJ3NlbGYnXCIsICdkYXRhOicsICdjZG4uanNkZWxpdnIubmV0J10sXG5cdFx0XHRcdGZvbnRTcmM6IFtcIidzZWxmJ1wiLCAnZm9udHMuZ3N0YXRpYy5jb20nXSxcblx0XHRcdFx0Y29ubmVjdFNyYzogW1wiJ3NlbGYnXCJdLFxuXHRcdFx0XHRvYmplY3RTcmM6IFtcIidub25lJ1wiXSxcblx0XHRcdFx0dXBncmFkZUluc2VjdXJlUmVxdWVzdHM6IFtdXG5cdFx0XHR9XG5cdFx0fSxcblx0XHRkbnNQcmVmZXRjaENvbnRyb2w6IHsgYWxsb3c6IGZhbHNlIH0sXG5cdFx0ZnJhbWVndWFyZDogeyBhY3Rpb246ICdkZW55JyB9LCAvLyBhbnRpLWNsaWNramFja2luZ1xuXHRcdGhpZGVQb3dlcmVkQnk6IHRydWUsXG5cdFx0Ly8gVE9ETzogdHVybiB0aGlzIG9uIHdoZW4gSFRUUFMgd29ya3Ncblx0XHQvLyBoc3RzOiB7IG1heEFnZTogMzE1MzYwMDAsIGluY2x1ZGVTdWJEb21haW5zOiB0cnVlLCBwcmVsb2FkOiB0cnVlIH0sIC8vIGVuZm9yY2UgSFRUUFNcblx0XHRwZXJtaXR0ZWRDcm9zc0RvbWFpblBvbGljaWVzOiB7IHBlcm1pdHRlZFBvbGljaWVzOiAnbm9uZScgfSxcblx0XHRyZWZlcnJlclBvbGljeTogeyBwb2xpY3k6ICduby1yZWZlcnJlcicgfSxcblx0XHR4c3NGaWx0ZXI6IHRydWVcblx0fSk7XG5cblx0Ly8gMy4gUmF0ZSBMaW1pdGluZ1xuXHRhcHAucmVnaXN0ZXIoZmFzdGlmeVJhdGVMaW1pdCwge1xuXHRcdG1heDogMTAwLCAvLyAxMDAgcmVxdWVzdHNcblx0XHR0aW1lV2luZG93OiAnMSBtaW51dGUnLFxuXHRcdGVycm9yUmVzcG9uc2VCdWlsZGVyOiAoX3JlcSwgY29udGV4dCkgPT4ge1xuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0c3RhdHVzQ29kZTogNDI5LFxuXHRcdFx0XHRlcnJvcjogJ1RvbyBNYW55IFJlcXVlc3RzJyxcblx0XHRcdFx0bWVzc2FnZTogYENhbG0gZG93biEgVHJ5IGFnYWluIGluICR7Y29udGV4dC50dGwgLyAxMDAwfSBzZWNvbmRzLmBcblx0XHRcdH07XG5cdFx0fVxuXHR9KTtcblxuXHQvLyA0LiBDb21wcmVzc2lvblxuXHRhcHAucmVnaXN0ZXIoZmFzdGlmeUNvbXByZXNzLCB7XG5cdFx0Y3VzdG9tVHlwZXM6IC9edGV4dFxcL3xcXCtqc29uJHxcXCt4bWwkLyxcblx0XHRnbG9iYWw6IHRydWUsXG5cdFx0ZW5jb2RpbmdzOiBbJ2d6aXAnLCAnZGVmbGF0ZScsICdiciddLFxuXHRcdHRocmVzaG9sZDogMTAyNFxuXHR9KTtcblxuXHRjb25zb2xlLmxvZygnU2VjdXJpdHkgbWlkZGxld2FyZSByZWdpc3RlcmVkJyk7XG59O1xuIl19