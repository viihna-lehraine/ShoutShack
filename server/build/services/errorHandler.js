// File: server/src/services/errorHandler.ts
import { AppError } from '../types/index.js';
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXJyb3JIYW5kbGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3NlcnZpY2VzL2Vycm9ySGFuZGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSw0Q0FBNEM7QUFFNUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLG1CQUFtQixDQUFDO0FBRzdDLE1BQU0sQ0FBQyxNQUFNLDBCQUEwQixHQUFHLENBQUMsR0FBb0IsRUFBRSxFQUFFO0lBQ2xFLEdBQUcsQ0FBQyxlQUFlLENBQUMsQ0FBQyxLQUFtQixFQUFFLElBQW9CLEVBQUUsS0FBbUIsRUFBRSxFQUFFO1FBQ3RGLE1BQU0sVUFBVSxHQUFHLEtBQUssWUFBWSxRQUFRLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQztRQUV0RSxPQUFPLENBQUMsS0FBSyxDQUFDLFdBQVcsS0FBSyxDQUFDLE9BQU8sRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDO1FBRWxFLEtBQUssQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQzdCLE9BQU8sRUFBRSxLQUFLO1lBQ2QsS0FBSyxFQUFFLEtBQUssQ0FBQyxJQUFJLElBQUkscUJBQXFCO1lBQzFDLE9BQU8sRUFBRSxLQUFLLENBQUMsT0FBTyxJQUFJLHNCQUFzQjtZQUNoRCxVQUFVO1NBQ1YsQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDLENBQUM7SUFFSCxPQUFPLENBQUMsR0FBRyxDQUFDLGlDQUFpQyxDQUFDLENBQUM7QUFDaEQsQ0FBQyxDQUFDIn0=