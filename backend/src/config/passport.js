import { __awaiter } from 'tslib';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Strategy as LocalStrategy } from 'passport-local';
import setupLogger from '../middleware/logger.js';
import getSecrets from './secrets.js';
import UserModelPromise from '../models/User.js';
export default function configurePassport(passport) {
	return __awaiter(this, void 0, void 0, function* () {
		const secrets = yield getSecrets();
		const logger = yield setupLogger();
		const UserModel = yield UserModelPromise;
		const opts = {
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			secretOrKey: secrets.JWT_SECRET
		};
		passport.use(
			new JwtStrategy(opts, (jwt_payload, done) =>
				__awaiter(this, void 0, void 0, function* () {
					try {
						const user = yield UserModel.findByPk(jwt_payload.id);
						if (user) {
							logger.info(
								'JWT authentication successful for user ID: ',
								jwt_payload.id
							);
							return done(null, user);
						} else {
							logger.warn(
								'JWT authentication failed for user ID: ',
								jwt_payload.id
							);
							return done(null, false);
						}
					} catch (err) {
						logger.error('JWT authentication error: ', err);
						return done(err, false);
					}
				})
			)
		);
		passport.use(
			new LocalStrategy((username, password, done) =>
				__awaiter(this, void 0, void 0, function* () {
					try {
						const user = yield UserModel.findOne({
							where: { username }
						});
						if (!user) {
							logger.warn(
								'Local authentication failed: User not found: ',
								username
							);
							return done(null, false, {
								message: 'User not found'
							});
						}
						const isMatch = yield user.comparePassword(password);
						if (isMatch) {
							logger.info(
								'Local authentication successful for user: ',
								username
							);
							return done(null, user);
						} else {
							logger.warn(
								'Local authentication failed: incorrect password for user: ',
								username
							);
							return done(null, false, {
								message: 'Incorrect password'
							});
						}
					} catch (err) {
						logger.error(
							'Local authenticaton error for user: ',
							username,
							' : Error: ',
							err
						);
						return done(err);
					}
				})
			)
		);
	});
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFzc3BvcnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi90cy9jb25maWcvcGFzc3BvcnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUNBLE9BQU8sRUFDTixRQUFRLElBQUksV0FBVyxFQUN2QixVQUFVLEVBRVYsTUFBTSxjQUFjLENBQUM7QUFDdEIsT0FBTyxFQUFFLFFBQVEsSUFBSSxhQUFhLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQztBQUMzRCxPQUFPLFdBQVcsTUFBTSxzQkFBc0IsQ0FBQztBQUMvQyxPQUFPLFVBQVUsTUFBTSxXQUFXLENBQUM7QUFDbkMsT0FBTyxnQkFBZ0IsTUFBTSxnQkFBZ0IsQ0FBQztBQVM5QyxNQUFNLENBQUMsT0FBTyxVQUFnQixpQkFBaUIsQ0FBQyxRQUF3Qjs7UUFDdkUsTUFBTSxPQUFPLEdBQUcsTUFBTSxVQUFVLEVBQUUsQ0FBQztRQUNuQyxNQUFNLE1BQU0sR0FBRyxNQUFNLFdBQVcsRUFBRSxDQUFDO1FBQ25DLE1BQU0sU0FBUyxHQUFHLE1BQU0sZ0JBQWdCLENBQUM7UUFFekMsTUFBTSxJQUFJLEdBQW9CO1lBQzdCLGNBQWMsRUFBRSxVQUFVLENBQUMsMkJBQTJCLEVBQUU7WUFDeEQsV0FBVyxFQUFFLE9BQU8sQ0FBQyxVQUFVO1NBQy9CLENBQUM7UUFFRixRQUFRLENBQUMsR0FBRyxDQUNYLElBQUksV0FBVyxDQUNkLElBQUksRUFDSixDQUNDLFdBQTJCLEVBQzNCLElBSVMsRUFDUixFQUFFO1lBQ0gsSUFBSSxDQUFDO2dCQUNKLE1BQU0sSUFBSSxHQUFHLE1BQU0sU0FBUyxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ3RELElBQUksSUFBSSxFQUFFLENBQUM7b0JBQ1YsTUFBTSxDQUFDLElBQUksQ0FDViw2Q0FBNkMsRUFDN0MsV0FBVyxDQUFDLEVBQUUsQ0FDZCxDQUFDO29CQUNGLE9BQU8sSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDekIsQ0FBQztxQkFBTSxDQUFDO29CQUNQLE1BQU0sQ0FBQyxJQUFJLENBQ1YseUNBQXlDLEVBQ3pDLFdBQVcsQ0FBQyxFQUFFLENBQ2QsQ0FBQztvQkFDRixPQUFPLElBQUksQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQzFCLENBQUM7WUFDRixDQUFDO1lBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztnQkFDZCxNQUFNLENBQUMsS0FBSyxDQUFDLDRCQUE0QixFQUFFLEdBQUcsQ0FBQyxDQUFDO2dCQUNoRCxPQUFPLElBQUksQ0FBQyxHQUFZLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDbEMsQ0FBQztRQUNGLENBQUMsQ0FBQSxDQUNELENBQ0QsQ0FBQztRQUVGLFFBQVEsQ0FBQyxHQUFHLENBQ1gsSUFBSSxhQUFhLENBQUMsQ0FBTyxRQUFRLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxFQUFFO1lBQ3BELElBQUksQ0FBQztnQkFDSixNQUFNLElBQUksR0FBRyxNQUFNLFNBQVMsQ0FBQyxPQUFPLENBQUMsRUFBRSxLQUFLLEVBQUUsRUFBRSxRQUFRLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBQzlELElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztvQkFDWCxNQUFNLENBQUMsSUFBSSxDQUNWLCtDQUErQyxFQUMvQyxRQUFRLENBQ1IsQ0FBQztvQkFDRixPQUFPLElBQUksQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLEVBQUUsT0FBTyxFQUFFLGdCQUFnQixFQUFFLENBQUMsQ0FBQztnQkFDekQsQ0FBQztnQkFFRCxNQUFNLE9BQU8sR0FBRyxNQUFNLElBQUksQ0FBQyxlQUFlLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQ3JELElBQUksT0FBTyxFQUFFLENBQUM7b0JBQ2IsTUFBTSxDQUFDLElBQUksQ0FDViw0Q0FBNEMsRUFDNUMsUUFBUSxDQUNSLENBQUM7b0JBQ0YsT0FBTyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUN6QixDQUFDO3FCQUFNLENBQUM7b0JBQ1AsTUFBTSxDQUFDLElBQUksQ0FDViw0REFBNEQsRUFDNUQsUUFBUSxDQUNSLENBQUM7b0JBQ0YsT0FBTyxJQUFJLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxFQUFFLE9BQU8sRUFBRSxvQkFBb0IsRUFBRSxDQUFDLENBQUM7Z0JBQzdELENBQUM7WUFDRixDQUFDO1lBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztnQkFDZCxNQUFNLENBQUMsS0FBSyxDQUNYLHNDQUFzQyxFQUN0QyxRQUFRLEVBQ1IsWUFBWSxFQUNaLEdBQUcsQ0FDSCxDQUFDO2dCQUNGLE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ2xCLENBQUM7UUFDRixDQUFDLENBQUEsQ0FBQyxDQUNGLENBQUM7SUFDSCxDQUFDO0NBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBQYXNzcG9ydFN0YXRpYyB9IGZyb20gJ3Bhc3Nwb3J0JztcbmltcG9ydCB7XG5cdFN0cmF0ZWd5IGFzIEp3dFN0cmF0ZWd5LFxuXHRFeHRyYWN0Snd0LFxuXHRTdHJhdGVneU9wdGlvbnNcbn0gZnJvbSAncGFzc3BvcnQtand0JztcbmltcG9ydCB7IFN0cmF0ZWd5IGFzIExvY2FsU3RyYXRlZ3kgfSBmcm9tICdwYXNzcG9ydC1sb2NhbCc7XG5pbXBvcnQgc2V0dXBMb2dnZXIgZnJvbSAnLi4vbWlkZGxld2FyZS9sb2dnZXInO1xuaW1wb3J0IGdldFNlY3JldHMgZnJvbSAnLi9zZWNyZXRzJztcbmltcG9ydCBVc2VyTW9kZWxQcm9taXNlIGZyb20gJy4uL21vZGVscy9Vc2VyJztcblxuLy8gRGVmaW5lIHRoZSBzaGFwZSBvZiBhIHVzZXIgaW5zdGFuY2UgYmFzZWQgb24gVXNlciBtb2RlbFxuaW50ZXJmYWNlIFVzZXJJbnN0YW5jZSB7XG5cdGlkOiBzdHJpbmc7XG5cdHVzZXJuYW1lOiBzdHJpbmc7XG5cdGNvbXBhcmVQYXNzd29yZDogKHBhc3N3b3JkOiBzdHJpbmcpID0+IFByb21pc2U8Ym9vbGVhbj47XG59XG5cbmV4cG9ydCBkZWZhdWx0IGFzeW5jIGZ1bmN0aW9uIGNvbmZpZ3VyZVBhc3Nwb3J0KHBhc3Nwb3J0OiBQYXNzcG9ydFN0YXRpYykge1xuXHRjb25zdCBzZWNyZXRzID0gYXdhaXQgZ2V0U2VjcmV0cygpO1xuXHRjb25zdCBsb2dnZXIgPSBhd2FpdCBzZXR1cExvZ2dlcigpO1xuXHRjb25zdCBVc2VyTW9kZWwgPSBhd2FpdCBVc2VyTW9kZWxQcm9taXNlO1xuXG5cdGNvbnN0IG9wdHM6IFN0cmF0ZWd5T3B0aW9ucyA9IHtcblx0XHRqd3RGcm9tUmVxdWVzdDogRXh0cmFjdEp3dC5mcm9tQXV0aEhlYWRlckFzQmVhcmVyVG9rZW4oKSxcblx0XHRzZWNyZXRPcktleTogc2VjcmV0cy5KV1RfU0VDUkVUXG5cdH07XG5cblx0cGFzc3BvcnQudXNlKFxuXHRcdG5ldyBKd3RTdHJhdGVneShcblx0XHRcdG9wdHMsXG5cdFx0XHRhc3luYyAoXG5cdFx0XHRcdGp3dF9wYXlsb2FkOiB7IGlkOiBzdHJpbmcgfSxcblx0XHRcdFx0ZG9uZTogKFxuXHRcdFx0XHRcdGVycm9yOiBFcnJvciB8IG51bGwsXG5cdFx0XHRcdFx0dXNlcj86IFVzZXJJbnN0YW5jZSB8IGZhbHNlLFxuXHRcdFx0XHRcdGluZm8/OiB1bmtub3duXG5cdFx0XHRcdCkgPT4gdm9pZFxuXHRcdFx0KSA9PiB7XG5cdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0Y29uc3QgdXNlciA9IGF3YWl0IFVzZXJNb2RlbC5maW5kQnlQayhqd3RfcGF5bG9hZC5pZCk7XG5cdFx0XHRcdFx0aWYgKHVzZXIpIHtcblx0XHRcdFx0XHRcdGxvZ2dlci5pbmZvKFxuXHRcdFx0XHRcdFx0XHQnSldUIGF1dGhlbnRpY2F0aW9uIHN1Y2Nlc3NmdWwgZm9yIHVzZXIgSUQ6ICcsXG5cdFx0XHRcdFx0XHRcdGp3dF9wYXlsb2FkLmlkXG5cdFx0XHRcdFx0XHQpO1xuXHRcdFx0XHRcdFx0cmV0dXJuIGRvbmUobnVsbCwgdXNlcik7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdGxvZ2dlci53YXJuKFxuXHRcdFx0XHRcdFx0XHQnSldUIGF1dGhlbnRpY2F0aW9uIGZhaWxlZCBmb3IgdXNlciBJRDogJyxcblx0XHRcdFx0XHRcdFx0and0X3BheWxvYWQuaWRcblx0XHRcdFx0XHRcdCk7XG5cdFx0XHRcdFx0XHRyZXR1cm4gZG9uZShudWxsLCBmYWxzZSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9IGNhdGNoIChlcnIpIHtcblx0XHRcdFx0XHRsb2dnZXIuZXJyb3IoJ0pXVCBhdXRoZW50aWNhdGlvbiBlcnJvcjogJywgZXJyKTtcblx0XHRcdFx0XHRyZXR1cm4gZG9uZShlcnIgYXMgRXJyb3IsIGZhbHNlKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdClcblx0KTtcblxuXHRwYXNzcG9ydC51c2UoXG5cdFx0bmV3IExvY2FsU3RyYXRlZ3koYXN5bmMgKHVzZXJuYW1lLCBwYXNzd29yZCwgZG9uZSkgPT4ge1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0Y29uc3QgdXNlciA9IGF3YWl0IFVzZXJNb2RlbC5maW5kT25lKHsgd2hlcmU6IHsgdXNlcm5hbWUgfSB9KTtcblx0XHRcdFx0aWYgKCF1c2VyKSB7XG5cdFx0XHRcdFx0bG9nZ2VyLndhcm4oXG5cdFx0XHRcdFx0XHQnTG9jYWwgYXV0aGVudGljYXRpb24gZmFpbGVkOiBVc2VyIG5vdCBmb3VuZDogJyxcblx0XHRcdFx0XHRcdHVzZXJuYW1lXG5cdFx0XHRcdFx0KTtcblx0XHRcdFx0XHRyZXR1cm4gZG9uZShudWxsLCBmYWxzZSwgeyBtZXNzYWdlOiAnVXNlciBub3QgZm91bmQnIH0pO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Y29uc3QgaXNNYXRjaCA9IGF3YWl0IHVzZXIuY29tcGFyZVBhc3N3b3JkKHBhc3N3b3JkKTtcblx0XHRcdFx0aWYgKGlzTWF0Y2gpIHtcblx0XHRcdFx0XHRsb2dnZXIuaW5mbyhcblx0XHRcdFx0XHRcdCdMb2NhbCBhdXRoZW50aWNhdGlvbiBzdWNjZXNzZnVsIGZvciB1c2VyOiAnLFxuXHRcdFx0XHRcdFx0dXNlcm5hbWVcblx0XHRcdFx0XHQpO1xuXHRcdFx0XHRcdHJldHVybiBkb25lKG51bGwsIHVzZXIpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGxvZ2dlci53YXJuKFxuXHRcdFx0XHRcdFx0J0xvY2FsIGF1dGhlbnRpY2F0aW9uIGZhaWxlZDogaW5jb3JyZWN0IHBhc3N3b3JkIGZvciB1c2VyOiAnLFxuXHRcdFx0XHRcdFx0dXNlcm5hbWVcblx0XHRcdFx0XHQpO1xuXHRcdFx0XHRcdHJldHVybiBkb25lKG51bGwsIGZhbHNlLCB7IG1lc3NhZ2U6ICdJbmNvcnJlY3QgcGFzc3dvcmQnIH0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9IGNhdGNoIChlcnIpIHtcblx0XHRcdFx0bG9nZ2VyLmVycm9yKFxuXHRcdFx0XHRcdCdMb2NhbCBhdXRoZW50aWNhdG9uIGVycm9yIGZvciB1c2VyOiAnLFxuXHRcdFx0XHRcdHVzZXJuYW1lLFxuXHRcdFx0XHRcdCcgOiBFcnJvcjogJyxcblx0XHRcdFx0XHRlcnJcblx0XHRcdFx0KTtcblx0XHRcdFx0cmV0dXJuIGRvbmUoZXJyKTtcblx0XHRcdH1cblx0XHR9KVxuXHQpO1xufVxuIl19
