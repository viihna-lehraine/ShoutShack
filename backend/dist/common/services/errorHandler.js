// File: backend/src/common/services/errorHandler.ts
import { AppError } from '../../types/index.js';
export const registerGlobalErrorHandler = (app) => {
    app.setErrorHandler((error, _req, reply) => {
        const statusCode = error instanceof AppError ? error.statusCode : 500;
        console.error(`[ERROR] ${error.message}`, { stack: error.stack });
        reply.status(statusCode).send({
            success: false,
            error: error.name || 'InternalServerError',
            message: error.message || 'Something went wrong',
            statusCode
        });
    });
    console.log('Global error handler registered');
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXJyb3JIYW5kbGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2NvbW1vbi9zZXJ2aWNlcy9lcnJvckhhbmRsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsb0RBQW9EO0FBRXBELE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQztBQUdoRCxNQUFNLENBQUMsTUFBTSwwQkFBMEIsR0FBRyxDQUFDLEdBQW9CLEVBQUUsRUFBRTtJQUNsRSxHQUFHLENBQUMsZUFBZSxDQUFDLENBQUMsS0FBbUIsRUFBRSxJQUFvQixFQUFFLEtBQW1CLEVBQUUsRUFBRTtRQUN0RixNQUFNLFVBQVUsR0FBRyxLQUFLLFlBQVksUUFBUSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUM7UUFFdEUsT0FBTyxDQUFDLEtBQUssQ0FBQyxXQUFXLEtBQUssQ0FBQyxPQUFPLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQztRQUVsRSxLQUFLLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUM3QixPQUFPLEVBQUUsS0FBSztZQUNkLEtBQUssRUFBRSxLQUFLLENBQUMsSUFBSSxJQUFJLHFCQUFxQjtZQUMxQyxPQUFPLEVBQUUsS0FBSyxDQUFDLE9BQU8sSUFBSSxzQkFBc0I7WUFDaEQsVUFBVTtTQUNWLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQyxDQUFDO0lBRUgsT0FBTyxDQUFDLEdBQUcsQ0FBQyxpQ0FBaUMsQ0FBQyxDQUFDO0FBQ2hELENBQUMsQ0FBQyJ9