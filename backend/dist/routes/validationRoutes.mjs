import express from 'express';
import { validationResult } from 'express-validator';
import { initializeValidatorMiddleware } from '../middleware/validator';
import { processError } from '../utils/processError';
import { validateDependencies } from '../utils/validateDependencies';
export default function initializeValidationRoutes({ logger, validator }) {
	const router = express.Router();
	try {
		validateDependencies(
			[
				{ name: 'logger', instance: logger },
				{ name: 'validator', instance: validator }
			],
			logger || console
		);
		const { registrationValidationRules } = initializeValidatorMiddleware({
			validator,
			logger
		});
		router.post(
			'/register',
			registrationValidationRules,
			async (req, res, next) => {
				try {
					const errors = validationResult(req);
					if (!errors.isEmpty()) {
						logger.error('Validation failed during registration', {
							errors: errors.array()
						});
						return res.status(400).json({ errors: errors.array() });
					}
					return next();
				} catch (error) {
					processError(error, logger, req);
					return res.status(500).json({
						error: 'Internal server error during validation'
					});
				}
			}
		);
	} catch (error) {
		processError(error, logger);
		throw error;
	}
	return router;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmFsaWRhdGlvblJvdXRlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9yb3V0ZXMvdmFsaWRhdGlvblJvdXRlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLE9BQW9ELE1BQU0sU0FBUyxDQUFDO0FBQzNFLE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxNQUFNLG1CQUFtQixDQUFDO0FBRXJELE9BQU8sRUFBRSw2QkFBNkIsRUFBRSxNQUFNLHlCQUF5QixDQUFDO0FBQ3hFLE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSx1QkFBdUIsQ0FBQztBQUNyRCxPQUFPLEVBQUUsb0JBQW9CLEVBQUUsTUFBTSwrQkFBK0IsQ0FBQztBQU9yRSxNQUFNLENBQUMsT0FBTyxVQUFVLDBCQUEwQixDQUFDLEVBQ2xELE1BQU0sRUFDTixTQUFTLEVBQ29CO0lBQzdCLE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQztJQUVoQyxJQUFJLENBQUM7UUFDSixvQkFBb0IsQ0FDbkI7WUFDQyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRTtZQUNwQyxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsUUFBUSxFQUFFLFNBQVMsRUFBRTtTQUMxQyxFQUNELE1BQU0sSUFBSSxPQUFPLENBQ2pCLENBQUM7UUFFRixNQUFNLEVBQUUsMkJBQTJCLEVBQUUsR0FBRyw2QkFBNkIsQ0FBQztZQUNyRSxTQUFTO1lBQ1QsTUFBTTtTQUNOLENBQUMsQ0FBQztRQUVILE1BQU0sQ0FBQyxJQUFJLENBQ1YsV0FBVyxFQUNYLDJCQUEyQixFQUMzQixLQUFLLEVBQUUsR0FBWSxFQUFFLEdBQWEsRUFBRSxJQUFrQixFQUFFLEVBQUU7WUFDekQsSUFBSSxDQUFDO2dCQUNKLE1BQU0sTUFBTSxHQUFHLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUVyQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUM7b0JBQ3ZCLE1BQU0sQ0FBQyxLQUFLLENBQUMsdUNBQXVDLEVBQUU7d0JBQ3JELE1BQU0sRUFBRSxNQUFNLENBQUMsS0FBSyxFQUFFO3FCQUN0QixDQUFDLENBQUM7b0JBQ0gsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sRUFBRSxNQUFNLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUN6RCxDQUFDO2dCQUVELE9BQU8sSUFBSSxFQUFFLENBQUM7WUFDZixDQUFDO1lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztnQkFDaEIsWUFBWSxDQUFDLEtBQWMsRUFBRSxNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUM7Z0JBQzFDLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7b0JBQzNCLEtBQUssRUFBRSx5Q0FBeUM7aUJBQ2hELENBQUMsQ0FBQztZQUNKLENBQUM7UUFDRixDQUFDLENBQ0QsQ0FBQztJQUNILENBQUM7SUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1FBQ2hCLFlBQVksQ0FBQyxLQUFjLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDckMsTUFBTSxLQUFLLENBQUM7SUFDYixDQUFDO0lBRUQsT0FBTyxNQUFNLENBQUM7QUFDZixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGV4cHJlc3MsIHsgUmVxdWVzdCwgUmVzcG9uc2UsIE5leHRGdW5jdGlvbiwgUm91dGVyIH0gZnJvbSAnZXhwcmVzcyc7XG5pbXBvcnQgeyB2YWxpZGF0aW9uUmVzdWx0IH0gZnJvbSAnZXhwcmVzcy12YWxpZGF0b3InO1xuaW1wb3J0IHsgTG9nZ2VyIH0gZnJvbSAnLi4vY29uZmlnL2xvZ2dlcic7XG5pbXBvcnQgeyBpbml0aWFsaXplVmFsaWRhdG9yTWlkZGxld2FyZSB9IGZyb20gJy4uL21pZGRsZXdhcmUvdmFsaWRhdG9yJztcbmltcG9ydCB7IHByb2Nlc3NFcnJvciB9IGZyb20gJy4uL3V0aWxzL3Byb2Nlc3NFcnJvcic7XG5pbXBvcnQgeyB2YWxpZGF0ZURlcGVuZGVuY2llcyB9IGZyb20gJy4uL3V0aWxzL3ZhbGlkYXRlRGVwZW5kZW5jaWVzJztcblxuaW50ZXJmYWNlIFZhbGlkYXRpb25Sb3V0ZURlcGVuZGVuY2llcyB7XG5cdGxvZ2dlcjogTG9nZ2VyO1xuXHR2YWxpZGF0b3I6IHR5cGVvZiBpbXBvcnQoJ3ZhbGlkYXRvcicpO1xufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBpbml0aWFsaXplVmFsaWRhdGlvblJvdXRlcyh7XG5cdGxvZ2dlcixcblx0dmFsaWRhdG9yXG59OiBWYWxpZGF0aW9uUm91dGVEZXBlbmRlbmNpZXMpOiBSb3V0ZXIge1xuXHRjb25zdCByb3V0ZXIgPSBleHByZXNzLlJvdXRlcigpO1xuXG5cdHRyeSB7XG5cdFx0dmFsaWRhdGVEZXBlbmRlbmNpZXMoXG5cdFx0XHRbXG5cdFx0XHRcdHsgbmFtZTogJ2xvZ2dlcicsIGluc3RhbmNlOiBsb2dnZXIgfSxcblx0XHRcdFx0eyBuYW1lOiAndmFsaWRhdG9yJywgaW5zdGFuY2U6IHZhbGlkYXRvciB9XG5cdFx0XHRdLFxuXHRcdFx0bG9nZ2VyIHx8IGNvbnNvbGVcblx0XHQpO1xuXG5cdFx0Y29uc3QgeyByZWdpc3RyYXRpb25WYWxpZGF0aW9uUnVsZXMgfSA9IGluaXRpYWxpemVWYWxpZGF0b3JNaWRkbGV3YXJlKHtcblx0XHRcdHZhbGlkYXRvcixcblx0XHRcdGxvZ2dlclxuXHRcdH0pO1xuXG5cdFx0cm91dGVyLnBvc3QoXG5cdFx0XHQnL3JlZ2lzdGVyJyxcblx0XHRcdHJlZ2lzdHJhdGlvblZhbGlkYXRpb25SdWxlcyxcblx0XHRcdGFzeW5jIChyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UsIG5leHQ6IE5leHRGdW5jdGlvbikgPT4ge1xuXHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdGNvbnN0IGVycm9ycyA9IHZhbGlkYXRpb25SZXN1bHQocmVxKTtcblxuXHRcdFx0XHRcdGlmICghZXJyb3JzLmlzRW1wdHkoKSkge1xuXHRcdFx0XHRcdFx0bG9nZ2VyLmVycm9yKCdWYWxpZGF0aW9uIGZhaWxlZCBkdXJpbmcgcmVnaXN0cmF0aW9uJywge1xuXHRcdFx0XHRcdFx0XHRlcnJvcnM6IGVycm9ycy5hcnJheSgpXG5cdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7IGVycm9yczogZXJyb3JzLmFycmF5KCkgfSk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0cmV0dXJuIG5leHQoKTtcblx0XHRcdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdFx0XHRwcm9jZXNzRXJyb3IoZXJyb3IgYXMgRXJyb3IsIGxvZ2dlciwgcmVxKTtcblx0XHRcdFx0XHRyZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oe1xuXHRcdFx0XHRcdFx0ZXJyb3I6ICdJbnRlcm5hbCBzZXJ2ZXIgZXJyb3IgZHVyaW5nIHZhbGlkYXRpb24nXG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHQpO1xuXHR9IGNhdGNoIChlcnJvcikge1xuXHRcdHByb2Nlc3NFcnJvcihlcnJvciBhcyBFcnJvciwgbG9nZ2VyKTtcblx0XHR0aHJvdyBlcnJvcjtcblx0fVxuXG5cdHJldHVybiByb3V0ZXI7XG59XG4iXX0=
