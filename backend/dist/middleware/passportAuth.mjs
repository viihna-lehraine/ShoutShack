import { validateDependencies } from '../utils/validateDependencies.mjs';
import { processError } from '../utils/processError.mjs';
export const initializePassportAuthMiddleware = ({
	passport,
	authenticateOptions,
	logger
}) => {
	validateDependencies(
		[
			{ name: 'passport', instance: passport },
			{ name: 'authenticateOptions', instance: authenticateOptions },
			{ name: 'logger', instance: logger }
		],
		logger || console
	);
	return (req, res, next) => {
		try {
			passport.authenticate('jwt', authenticateOptions, (err, user) => {
				if (err) {
					logger.error(
						`Passport authentication error: ${err.message}`
					);
					res.status(500).json({
						error: 'Internal Server Error'
					});
					return;
				}
				if (!user) {
					logger.warn('Unauthorized access attempt');
					res.status(401).json({ error: 'Unauthorized' });
					return;
				}
				req.user = user;
				return next();
			})(req, res, next);
		} catch (error) {
			processError(error, logger || console, req);
			res.status(500).json({ error: 'Internal Server Error' });
		}
	};
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFzc3BvcnRBdXRoLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL21pZGRsZXdhcmUvcGFzc3BvcnRBdXRoLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUdBLE9BQU8sRUFBRSxvQkFBb0IsRUFBRSxNQUFNLCtCQUErQixDQUFDO0FBQ3JFLE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSx1QkFBdUIsQ0FBQztBQVFyRCxNQUFNLENBQUMsTUFBTSxnQ0FBZ0MsR0FBRyxDQUFDLEVBQ2hELFFBQVEsRUFDUixtQkFBbUIsRUFDbkIsTUFBTSxFQUM4QixFQUFFLEVBQUU7SUFDeEMsb0JBQW9CLENBQ25CO1FBQ0MsRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUU7UUFDeEMsRUFBRSxJQUFJLEVBQUUscUJBQXFCLEVBQUUsUUFBUSxFQUFFLG1CQUFtQixFQUFFO1FBQzlELEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFO0tBQ3BDLEVBQ0QsTUFBTSxJQUFJLE9BQU8sQ0FDakIsQ0FBQztJQUVGLE9BQU8sQ0FBQyxHQUFZLEVBQUUsR0FBYSxFQUFFLElBQWtCLEVBQVEsRUFBRTtRQUNoRSxJQUFJLENBQUM7WUFDSixRQUFRLENBQUMsWUFBWSxDQUNwQixLQUFLLEVBQ0wsbUJBQW1CLEVBQ25CLENBQUMsR0FBaUIsRUFBRSxJQUEwQixFQUFFLEVBQUU7Z0JBQ2pELElBQUksR0FBRyxFQUFFLENBQUM7b0JBQ1QsTUFBTSxDQUFDLEtBQUssQ0FDWCxrQ0FBa0MsR0FBRyxDQUFDLE9BQU8sRUFBRSxDQUMvQyxDQUFDO29CQUNGLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO3dCQUNwQixLQUFLLEVBQUUsdUJBQXVCO3FCQUM5QixDQUFDLENBQUM7b0JBQ0gsT0FBTztnQkFDUixDQUFDO2dCQUNELElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztvQkFDWCxNQUFNLENBQUMsSUFBSSxDQUFDLDZCQUE2QixDQUFDLENBQUM7b0JBQzNDLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxFQUFFLGNBQWMsRUFBRSxDQUFDLENBQUM7b0JBQ2hELE9BQU87Z0JBQ1IsQ0FBQztnQkFDRCxHQUFHLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztnQkFDaEIsT0FBTyxJQUFJLEVBQUUsQ0FBQztZQUNmLENBQUMsQ0FDRCxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDbkIsQ0FBQztRQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7WUFDaEIsWUFBWSxDQUFDLEtBQUssRUFBRSxNQUFNLElBQUksT0FBTyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQzVDLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxFQUFFLHVCQUF1QixFQUFFLENBQUMsQ0FBQztRQUMxRCxDQUFDO0lBQ0YsQ0FBQyxDQUFDO0FBQ0gsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTmV4dEZ1bmN0aW9uLCBSZXF1ZXN0LCBSZXNwb25zZSB9IGZyb20gJ2V4cHJlc3MnO1xuaW1wb3J0IHsgQXV0aGVudGljYXRlT3B0aW9ucywgUGFzc3BvcnRTdGF0aWMgfSBmcm9tICdwYXNzcG9ydCc7XG5pbXBvcnQgeyBMb2dnZXIgfSBmcm9tICcuLi9jb25maWcvbG9nZ2VyJztcbmltcG9ydCB7IHZhbGlkYXRlRGVwZW5kZW5jaWVzIH0gZnJvbSAnLi4vdXRpbHMvdmFsaWRhdGVEZXBlbmRlbmNpZXMnO1xuaW1wb3J0IHsgcHJvY2Vzc0Vycm9yIH0gZnJvbSAnLi4vdXRpbHMvcHJvY2Vzc0Vycm9yJztcblxuaW50ZXJmYWNlIFBhc3Nwb3J0QXV0aE1pZGRsZXdhcmVEZXBlbmRlbmNpZXMge1xuXHRwYXNzcG9ydDogUGFzc3BvcnRTdGF0aWM7XG5cdGF1dGhlbnRpY2F0ZU9wdGlvbnM6IEF1dGhlbnRpY2F0ZU9wdGlvbnM7XG5cdGxvZ2dlcjogTG9nZ2VyO1xufVxuXG5leHBvcnQgY29uc3QgaW5pdGlhbGl6ZVBhc3Nwb3J0QXV0aE1pZGRsZXdhcmUgPSAoe1xuXHRwYXNzcG9ydCxcblx0YXV0aGVudGljYXRlT3B0aW9ucyxcblx0bG9nZ2VyXG59OiBQYXNzcG9ydEF1dGhNaWRkbGV3YXJlRGVwZW5kZW5jaWVzKSA9PiB7XG5cdHZhbGlkYXRlRGVwZW5kZW5jaWVzKFxuXHRcdFtcblx0XHRcdHsgbmFtZTogJ3Bhc3Nwb3J0JywgaW5zdGFuY2U6IHBhc3Nwb3J0IH0sXG5cdFx0XHR7IG5hbWU6ICdhdXRoZW50aWNhdGVPcHRpb25zJywgaW5zdGFuY2U6IGF1dGhlbnRpY2F0ZU9wdGlvbnMgfSxcblx0XHRcdHsgbmFtZTogJ2xvZ2dlcicsIGluc3RhbmNlOiBsb2dnZXIgfVxuXHRcdF0sXG5cdFx0bG9nZ2VyIHx8IGNvbnNvbGVcblx0KTtcblxuXHRyZXR1cm4gKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSwgbmV4dDogTmV4dEZ1bmN0aW9uKTogdm9pZCA9PiB7XG5cdFx0dHJ5IHtcblx0XHRcdHBhc3Nwb3J0LmF1dGhlbnRpY2F0ZShcblx0XHRcdFx0J2p3dCcsXG5cdFx0XHRcdGF1dGhlbnRpY2F0ZU9wdGlvbnMsXG5cdFx0XHRcdChlcnI6IEVycm9yIHwgbnVsbCwgdXNlcjogRXhwcmVzcy5Vc2VyIHwgZmFsc2UpID0+IHtcblx0XHRcdFx0XHRpZiAoZXJyKSB7XG5cdFx0XHRcdFx0XHRsb2dnZXIuZXJyb3IoXG5cdFx0XHRcdFx0XHRcdGBQYXNzcG9ydCBhdXRoZW50aWNhdGlvbiBlcnJvcjogJHtlcnIubWVzc2FnZX1gXG5cdFx0XHRcdFx0XHQpO1xuXHRcdFx0XHRcdFx0cmVzLnN0YXR1cyg1MDApLmpzb24oe1xuXHRcdFx0XHRcdFx0XHRlcnJvcjogJ0ludGVybmFsIFNlcnZlciBFcnJvcidcblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRpZiAoIXVzZXIpIHtcblx0XHRcdFx0XHRcdGxvZ2dlci53YXJuKCdVbmF1dGhvcml6ZWQgYWNjZXNzIGF0dGVtcHQnKTtcblx0XHRcdFx0XHRcdHJlcy5zdGF0dXMoNDAxKS5qc29uKHsgZXJyb3I6ICdVbmF1dGhvcml6ZWQnIH0pO1xuXHRcdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRyZXEudXNlciA9IHVzZXI7XG5cdFx0XHRcdFx0cmV0dXJuIG5leHQoKTtcblx0XHRcdFx0fVxuXHRcdFx0KShyZXEsIHJlcywgbmV4dCk7XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdHByb2Nlc3NFcnJvcihlcnJvciwgbG9nZ2VyIHx8IGNvbnNvbGUsIHJlcSk7XG5cdFx0XHRyZXMuc3RhdHVzKDUwMCkuanNvbih7IGVycm9yOiAnSW50ZXJuYWwgU2VydmVyIEVycm9yJyB9KTtcblx0XHR9XG5cdH07XG59O1xuIl19