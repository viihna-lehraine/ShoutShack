export const registerHtmlRoutes = (fastify) => {
    fastify.register(import('@fastify/static'), {
        root: '/usr/share/nginx/html/public/html',
        prefix: '/',
        decorateReply: false // prevents modification of response headers
    });
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHRtbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9yb3V0ZXMvc3RhdGljL2h0bWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBRUEsTUFBTSxDQUFDLE1BQU0sa0JBQWtCLEdBQUcsQ0FBQyxPQUF3QixFQUFFLEVBQUU7SUFDOUQsT0FBTyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsaUJBQWlCLENBQUMsRUFBRTtRQUMzQyxJQUFJLEVBQUUsbUNBQW1DO1FBQ3pDLE1BQU0sRUFBRSxHQUFHO1FBQ1gsYUFBYSxFQUFFLEtBQUssQ0FBQyw0Q0FBNEM7S0FDakUsQ0FBQyxDQUFDO0FBQ0osQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRmFzdGlmeUluc3RhbmNlIH0gZnJvbSAnZmFzdGlmeSc7XG5cbmV4cG9ydCBjb25zdCByZWdpc3Rlckh0bWxSb3V0ZXMgPSAoZmFzdGlmeTogRmFzdGlmeUluc3RhbmNlKSA9PiB7XG5cdGZhc3RpZnkucmVnaXN0ZXIoaW1wb3J0KCdAZmFzdGlmeS9zdGF0aWMnKSwge1xuXHRcdHJvb3Q6ICcvdXNyL3NoYXJlL25naW54L2h0bWwvcHVibGljL2h0bWwnLFxuXHRcdHByZWZpeDogJy8nLFxuXHRcdGRlY29yYXRlUmVwbHk6IGZhbHNlIC8vIHByZXZlbnRzIG1vZGlmaWNhdGlvbiBvZiByZXNwb25zZSBoZWFkZXJzXG5cdH0pO1xufTtcbiJdfQ==