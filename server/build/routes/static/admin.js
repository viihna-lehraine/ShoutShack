export const registerAdminRoutes = (fastify) => {
    fastify.register(import('@fastify/static'), {
        root: '/usr/share/nginx/html/admin',
        prefix: '/admin/'
    });
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWRtaW4uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvcm91dGVzL3N0YXRpYy9hZG1pbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFFQSxNQUFNLENBQUMsTUFBTSxtQkFBbUIsR0FBRyxDQUFDLE9BQXdCLEVBQUUsRUFBRTtJQUMvRCxPQUFPLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFO1FBQzNDLElBQUksRUFBRSw2QkFBNkI7UUFDbkMsTUFBTSxFQUFFLFNBQVM7S0FDakIsQ0FBQyxDQUFDO0FBQ0osQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRmFzdGlmeUluc3RhbmNlIH0gZnJvbSAnZmFzdGlmeSc7XG5cbmV4cG9ydCBjb25zdCByZWdpc3RlckFkbWluUm91dGVzID0gKGZhc3RpZnk6IEZhc3RpZnlJbnN0YW5jZSkgPT4ge1xuXHRmYXN0aWZ5LnJlZ2lzdGVyKGltcG9ydCgnQGZhc3RpZnkvc3RhdGljJyksIHtcblx0XHRyb290OiAnL3Vzci9zaGFyZS9uZ2lueC9odG1sL2FkbWluJyxcblx0XHRwcmVmaXg6ICcvYWRtaW4vJ1xuXHR9KTtcbn07XG4iXX0=