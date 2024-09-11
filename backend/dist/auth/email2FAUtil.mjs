import { validateDependencies } from '../utils/validateDependencies.mjs';
import { processError } from '../utils/processError.mjs';
export default async function createEmail2FAUtil({
	logger,
	getSecrets,
	bcrypt,
	jwt
}) {
	validateDependencies(
		[
			{ name: 'logger', instance: logger },
			{ name: 'getSecrets', instance: getSecrets },
			{ name: 'bcrypt', instance: bcrypt },
			{ name: 'jwt', instance: jwt }
		],
		logger
	);
	let secrets;
	try {
		secrets = await getSecrets();
		if (!secrets.EMAIL_2FA_KEY) {
			const error = new Error('Missing EMAIL_2FA_KEY in secrets');
			processError(error, logger);
			throw error;
		}
	} catch (err) {
		processError(err, logger);
		logger.error(
			'Email 2FA functionality will not work. Secrets could not be loaded.'
		);
		throw new Error('Failed to load secrets for email 2FA');
	}
	async function generateEmail2FACode() {
		try {
			const email2FACode = await bcrypt.genSalt(6); // generates a 6-character salt (2FA code)
			const email2FAToken = jwt.sign(
				{ email2FACode },
				secrets.EMAIL_2FA_KEY,
				{
					expiresIn: '30m'
				}
			);
			return {
				email2FACode, // raw 2FA code
				email2FAToken // JWT containing the 2FA code
			};
		} catch (err) {
			processError(err, logger);
			throw new Error('Failed to generate email 2FA code');
		}
	}
	async function verifyEmail2FACode(token, email2FACode) {
		try {
			const decoded = jwt.verify(token, secrets.EMAIL_2FA_KEY);
			if (!decoded || typeof decoded.email2FACode !== 'string') {
				logger.warn(
					'Invalid token structure during email 2FA verification'
				);
				return false;
			}
			// ensure the decoded 2FA code matches the provided 2FA code
			return decoded.email2FACode === email2FACode;
		} catch (err) {
			if (err instanceof jwt.JsonWebTokenError) {
				logger.warn(
					`JWT error during email 2FA verification: ${err.message}`
				);
			} else {
				processError(err, logger);
			}
			return false;
		}
	}
	return {
		generateEmail2FACode,
		verifyEmail2FACode
	};
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW1haWwyRkFVdGlsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2F1dGgvZW1haWwyRkFVdGlsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUdBLE9BQU8sRUFBRSxvQkFBb0IsRUFBRSxNQUFNLCtCQUErQixDQUFDO0FBQ3JFLE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSx1QkFBdUIsQ0FBQztBQWFyRCxNQUFNLENBQUMsT0FBTyxDQUFDLEtBQUssVUFBVSxrQkFBa0IsQ0FBQyxFQUNoRCxNQUFNLEVBQ04sVUFBVSxFQUNWLE1BQU0sRUFDTixHQUFHLEVBQ3VCO0lBVTFCLG9CQUFvQixDQUNuQjtRQUNDLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFO1FBQ3BDLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxRQUFRLEVBQUUsVUFBVSxFQUFFO1FBQzVDLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFO1FBQ3BDLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsR0FBRyxFQUFFO0tBQzlCLEVBQ0QsTUFBTSxDQUNOLENBQUM7SUFFRixJQUFJLE9BQWdCLENBQUM7SUFFckIsSUFBSSxDQUFDO1FBQ0osT0FBTyxHQUFHLE1BQU0sVUFBVSxFQUFFLENBQUM7UUFFN0IsSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUM1QixNQUFNLEtBQUssR0FBRyxJQUFJLEtBQUssQ0FBQyxrQ0FBa0MsQ0FBQyxDQUFDO1lBQzVELFlBQVksQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDNUIsTUFBTSxLQUFLLENBQUM7UUFDYixDQUFDO0lBQ0YsQ0FBQztJQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7UUFDZCxZQUFZLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQzFCLE1BQU0sQ0FBQyxLQUFLLENBQ1gscUVBQXFFLENBQ3JFLENBQUM7UUFDRixNQUFNLElBQUksS0FBSyxDQUFDLHNDQUFzQyxDQUFDLENBQUM7SUFDekQsQ0FBQztJQUVELEtBQUssVUFBVSxvQkFBb0I7UUFJbEMsSUFBSSxDQUFDO1lBQ0osTUFBTSxZQUFZLEdBQUcsTUFBTSxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsMENBQTBDO1lBQ3hGLE1BQU0sYUFBYSxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQzdCLEVBQUUsWUFBWSxFQUFFLEVBQ2hCLE9BQU8sQ0FBQyxhQUFhLEVBQ3JCO2dCQUNDLFNBQVMsRUFBRSxLQUFLO2FBQ2hCLENBQ0QsQ0FBQztZQUVGLE9BQU87Z0JBQ04sWUFBWSxFQUFFLGVBQWU7Z0JBQzdCLGFBQWEsQ0FBQyw4QkFBOEI7YUFDNUMsQ0FBQztRQUNILENBQUM7UUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1lBQ2QsWUFBWSxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsQ0FBQztZQUMxQixNQUFNLElBQUksS0FBSyxDQUFDLG1DQUFtQyxDQUFDLENBQUM7UUFDdEQsQ0FBQztJQUNGLENBQUM7SUFFRCxLQUFLLFVBQVUsa0JBQWtCLENBQ2hDLEtBQWEsRUFDYixZQUFvQjtRQUVwQixJQUFJLENBQUM7WUFDSixNQUFNLE9BQU8sR0FBRyxHQUFHLENBQUMsTUFBTSxDQUN6QixLQUFLLEVBQ0wsT0FBTyxDQUFDLGFBQWEsQ0FDUCxDQUFDO1lBRWhCLElBQUksQ0FBQyxPQUFPLElBQUksT0FBTyxPQUFPLENBQUMsWUFBWSxLQUFLLFFBQVEsRUFBRSxDQUFDO2dCQUMxRCxNQUFNLENBQUMsSUFBSSxDQUNWLHVEQUF1RCxDQUN2RCxDQUFDO2dCQUNGLE9BQU8sS0FBSyxDQUFDO1lBQ2QsQ0FBQztZQUVELDREQUE0RDtZQUM1RCxPQUFPLE9BQU8sQ0FBQyxZQUFZLEtBQUssWUFBWSxDQUFDO1FBQzlDLENBQUM7UUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1lBQ2QsSUFBSSxHQUFHLFlBQVksR0FBRyxDQUFDLGlCQUFpQixFQUFFLENBQUM7Z0JBQzFDLE1BQU0sQ0FBQyxJQUFJLENBQ1YsNENBQTRDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FDekQsQ0FBQztZQUNILENBQUM7aUJBQU0sQ0FBQztnQkFDUCxZQUFZLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQzNCLENBQUM7WUFDRCxPQUFPLEtBQUssQ0FBQztRQUNkLENBQUM7SUFDRixDQUFDO0lBRUQsT0FBTztRQUNOLG9CQUFvQjtRQUNwQixrQkFBa0I7S0FDbEIsQ0FBQztBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgYmNyeXB0IGZyb20gJ2JjcnlwdCc7XG5pbXBvcnQgand0LCB7IEp3dFBheWxvYWQgfSBmcm9tICdqc29ud2VidG9rZW4nO1xuaW1wb3J0IHsgTG9nZ2VyIH0gZnJvbSAnLi4vY29uZmlnL2xvZ2dlcic7XG5pbXBvcnQgeyB2YWxpZGF0ZURlcGVuZGVuY2llcyB9IGZyb20gJy4uL3V0aWxzL3ZhbGlkYXRlRGVwZW5kZW5jaWVzJztcbmltcG9ydCB7IHByb2Nlc3NFcnJvciB9IGZyb20gJy4uL3V0aWxzL3Byb2Nlc3NFcnJvcic7XG5cbmludGVyZmFjZSBTZWNyZXRzIHtcblx0RU1BSUxfMkZBX0tFWTogc3RyaW5nO1xufVxuXG5pbnRlcmZhY2UgRW1haWwyRkFVdGlsRGVwZW5kZW5jaWVzIHtcblx0bG9nZ2VyOiBMb2dnZXI7XG5cdGdldFNlY3JldHM6ICgpID0+IFByb21pc2U8U2VjcmV0cz47XG5cdGJjcnlwdDogdHlwZW9mIGJjcnlwdDtcblx0and0OiB0eXBlb2Ygand0O1xufVxuXG5leHBvcnQgZGVmYXVsdCBhc3luYyBmdW5jdGlvbiBjcmVhdGVFbWFpbDJGQVV0aWwoe1xuXHRsb2dnZXIsXG5cdGdldFNlY3JldHMsXG5cdGJjcnlwdCxcblx0and0XG59OiBFbWFpbDJGQVV0aWxEZXBlbmRlbmNpZXMpOiBQcm9taXNlPHtcblx0Z2VuZXJhdGVFbWFpbDJGQUNvZGU6ICgpID0+IFByb21pc2U8e1xuXHRcdGVtYWlsMkZBQ29kZTogc3RyaW5nO1xuXHRcdGVtYWlsMkZBVG9rZW46IHN0cmluZztcblx0fT47XG5cdHZlcmlmeUVtYWlsMkZBQ29kZTogKFxuXHRcdHRva2VuOiBzdHJpbmcsXG5cdFx0ZW1haWwyRkFDb2RlOiBzdHJpbmdcblx0KSA9PiBQcm9taXNlPGJvb2xlYW4+O1xufT4ge1xuXHR2YWxpZGF0ZURlcGVuZGVuY2llcyhcblx0XHRbXG5cdFx0XHR7IG5hbWU6ICdsb2dnZXInLCBpbnN0YW5jZTogbG9nZ2VyIH0sXG5cdFx0XHR7IG5hbWU6ICdnZXRTZWNyZXRzJywgaW5zdGFuY2U6IGdldFNlY3JldHMgfSxcblx0XHRcdHsgbmFtZTogJ2JjcnlwdCcsIGluc3RhbmNlOiBiY3J5cHQgfSxcblx0XHRcdHsgbmFtZTogJ2p3dCcsIGluc3RhbmNlOiBqd3QgfVxuXHRcdF0sXG5cdFx0bG9nZ2VyXG5cdCk7XG5cblx0bGV0IHNlY3JldHM6IFNlY3JldHM7XG5cblx0dHJ5IHtcblx0XHRzZWNyZXRzID0gYXdhaXQgZ2V0U2VjcmV0cygpO1xuXG5cdFx0aWYgKCFzZWNyZXRzLkVNQUlMXzJGQV9LRVkpIHtcblx0XHRcdGNvbnN0IGVycm9yID0gbmV3IEVycm9yKCdNaXNzaW5nIEVNQUlMXzJGQV9LRVkgaW4gc2VjcmV0cycpO1xuXHRcdFx0cHJvY2Vzc0Vycm9yKGVycm9yLCBsb2dnZXIpO1xuXHRcdFx0dGhyb3cgZXJyb3I7XG5cdFx0fVxuXHR9IGNhdGNoIChlcnIpIHtcblx0XHRwcm9jZXNzRXJyb3IoZXJyLCBsb2dnZXIpO1xuXHRcdGxvZ2dlci5lcnJvcihcblx0XHRcdCdFbWFpbCAyRkEgZnVuY3Rpb25hbGl0eSB3aWxsIG5vdCB3b3JrLiBTZWNyZXRzIGNvdWxkIG5vdCBiZSBsb2FkZWQuJ1xuXHRcdCk7XG5cdFx0dGhyb3cgbmV3IEVycm9yKCdGYWlsZWQgdG8gbG9hZCBzZWNyZXRzIGZvciBlbWFpbCAyRkEnKTtcblx0fVxuXG5cdGFzeW5jIGZ1bmN0aW9uIGdlbmVyYXRlRW1haWwyRkFDb2RlKCk6IFByb21pc2U8e1xuXHRcdGVtYWlsMkZBQ29kZTogc3RyaW5nO1xuXHRcdGVtYWlsMkZBVG9rZW46IHN0cmluZztcblx0fT4ge1xuXHRcdHRyeSB7XG5cdFx0XHRjb25zdCBlbWFpbDJGQUNvZGUgPSBhd2FpdCBiY3J5cHQuZ2VuU2FsdCg2KTsgLy8gZ2VuZXJhdGVzIGEgNi1jaGFyYWN0ZXIgc2FsdCAoMkZBIGNvZGUpXG5cdFx0XHRjb25zdCBlbWFpbDJGQVRva2VuID0gand0LnNpZ24oXG5cdFx0XHRcdHsgZW1haWwyRkFDb2RlIH0sXG5cdFx0XHRcdHNlY3JldHMuRU1BSUxfMkZBX0tFWSxcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGV4cGlyZXNJbjogJzMwbSdcblx0XHRcdFx0fVxuXHRcdFx0KTtcblxuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0ZW1haWwyRkFDb2RlLCAvLyByYXcgMkZBIGNvZGVcblx0XHRcdFx0ZW1haWwyRkFUb2tlbiAvLyBKV1QgY29udGFpbmluZyB0aGUgMkZBIGNvZGVcblx0XHRcdH07XG5cdFx0fSBjYXRjaCAoZXJyKSB7XG5cdFx0XHRwcm9jZXNzRXJyb3IoZXJyLCBsb2dnZXIpO1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdGYWlsZWQgdG8gZ2VuZXJhdGUgZW1haWwgMkZBIGNvZGUnKTtcblx0XHR9XG5cdH1cblxuXHRhc3luYyBmdW5jdGlvbiB2ZXJpZnlFbWFpbDJGQUNvZGUoXG5cdFx0dG9rZW46IHN0cmluZyxcblx0XHRlbWFpbDJGQUNvZGU6IHN0cmluZ1xuXHQpOiBQcm9taXNlPGJvb2xlYW4+IHtcblx0XHR0cnkge1xuXHRcdFx0Y29uc3QgZGVjb2RlZCA9IGp3dC52ZXJpZnkoXG5cdFx0XHRcdHRva2VuLFxuXHRcdFx0XHRzZWNyZXRzLkVNQUlMXzJGQV9LRVlcblx0XHRcdCkgYXMgSnd0UGF5bG9hZDtcblxuXHRcdFx0aWYgKCFkZWNvZGVkIHx8IHR5cGVvZiBkZWNvZGVkLmVtYWlsMkZBQ29kZSAhPT0gJ3N0cmluZycpIHtcblx0XHRcdFx0bG9nZ2VyLndhcm4oXG5cdFx0XHRcdFx0J0ludmFsaWQgdG9rZW4gc3RydWN0dXJlIGR1cmluZyBlbWFpbCAyRkEgdmVyaWZpY2F0aW9uJ1xuXHRcdFx0XHQpO1xuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9XG5cblx0XHRcdC8vIGVuc3VyZSB0aGUgZGVjb2RlZCAyRkEgY29kZSBtYXRjaGVzIHRoZSBwcm92aWRlZCAyRkEgY29kZVxuXHRcdFx0cmV0dXJuIGRlY29kZWQuZW1haWwyRkFDb2RlID09PSBlbWFpbDJGQUNvZGU7XG5cdFx0fSBjYXRjaCAoZXJyKSB7XG5cdFx0XHRpZiAoZXJyIGluc3RhbmNlb2Ygand0Lkpzb25XZWJUb2tlbkVycm9yKSB7XG5cdFx0XHRcdGxvZ2dlci53YXJuKFxuXHRcdFx0XHRcdGBKV1QgZXJyb3IgZHVyaW5nIGVtYWlsIDJGQSB2ZXJpZmljYXRpb246ICR7ZXJyLm1lc3NhZ2V9YFxuXHRcdFx0XHQpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cHJvY2Vzc0Vycm9yKGVyciwgbG9nZ2VyKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4ge1xuXHRcdGdlbmVyYXRlRW1haWwyRkFDb2RlLFxuXHRcdHZlcmlmeUVtYWlsMkZBQ29kZVxuXHR9O1xufVxuIl19