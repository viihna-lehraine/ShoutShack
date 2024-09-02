import argon2 from 'argon2';
import sops from '../utils/sops';
import { execSync } from 'child_process';
export const login =
	({ logger, UserModel, jwtUtil }) =>
	async (req, res) => {
		try {
			const { username, password } = req.body;
			const user = await UserModel.findOne({ where: { username } });
			if (!user) {
				return res
					.status(401)
					.json({ msg: 'Login failed - invalid credentials' });
			}
			const secrets = await sops.getSecrets({
				logger,
				execSync,
				getDirectoryPath: () => process.cwd()
			});
			const isPasswordValid = await user.comparePassword(
				password,
				argon2,
				secrets
			);
			if (!isPasswordValid) {
				return res.status(401).json({ msg: 'Invalid credentials' });
			}
			// generate JWT token and use it to respond
			const token = await jwtUtil.generateToken(user);
			return res.json({ token });
		} catch (err) {
			logger.error(err);
			return res.status(500).json({ msg: 'Server error' });
		}
	};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0aENvbnRyb2xsZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvY29udHJvbGxlcnMvYXV0aENvbnRyb2xsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBSUEsT0FBTyxNQUFNLE1BQU0sUUFBUSxDQUFDO0FBQzVCLE9BQU8sSUFBSSxNQUFNLGVBQWUsQ0FBQztBQUNqQyxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBU3pDLE1BQU0sQ0FBQyxNQUFNLEtBQUssR0FDakIsQ0FBQyxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFvQixFQUFFLEVBQUUsQ0FDckQsS0FBSyxFQUFFLEdBQVksRUFBRSxHQUFhLEVBQTRCLEVBQUU7SUFDL0QsSUFBSSxDQUFDO1FBQ0osTUFBTSxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDO1FBQ3hDLE1BQU0sSUFBSSxHQUFHLE1BQU0sU0FBUyxDQUFDLE9BQU8sQ0FBQyxFQUFFLEtBQUssRUFBRSxFQUFFLFFBQVEsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUU5RCxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDWCxPQUFPLEdBQUc7aUJBQ1IsTUFBTSxDQUFDLEdBQUcsQ0FBQztpQkFDWCxJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsb0NBQW9DLEVBQUUsQ0FBQyxDQUFDO1FBQ3ZELENBQUM7UUFFRCxNQUFNLE9BQU8sR0FBRyxNQUFNLElBQUksQ0FBQyxVQUFVLENBQUM7WUFDckMsTUFBTTtZQUNOLFFBQVE7WUFDUixnQkFBZ0IsRUFBRSxHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFO1NBQ3JDLENBQUMsQ0FBQztRQUVILE1BQU0sZUFBZSxHQUFHLE1BQU0sSUFBSSxDQUFDLGVBQWUsQ0FDakQsUUFBUSxFQUNSLE1BQU0sRUFDTixPQUFPLENBQ1AsQ0FBQztRQUVGLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztZQUN0QixPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsR0FBRyxFQUFFLHFCQUFxQixFQUFFLENBQUMsQ0FBQztRQUM3RCxDQUFDO1FBRUQsMkNBQTJDO1FBQzNDLE1BQU0sS0FBSyxHQUFHLE1BQU0sT0FBTyxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNoRCxPQUFPLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO0lBQzVCLENBQUM7SUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1FBQ2QsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNsQixPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsR0FBRyxFQUFFLGNBQWMsRUFBRSxDQUFDLENBQUM7SUFDdEQsQ0FBQztBQUNGLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFJlcXVlc3QsIFJlc3BvbnNlIH0gZnJvbSAnZXhwcmVzcyc7XG5pbXBvcnQgeyBMb2dnZXIgfSBmcm9tICd3aW5zdG9uJztcbmltcG9ydCBjcmVhdGVKd3RVdGlsIGZyb20gJy4uL3V0aWxzL2F1dGgvand0VXRpbCc7XG5pbXBvcnQgY3JlYXRlVXNlck1vZGVsIGZyb20gJy4uL21vZGVscy9Vc2VyJztcbmltcG9ydCBhcmdvbjIgZnJvbSAnYXJnb24yJztcbmltcG9ydCBzb3BzIGZyb20gJy4uL3V0aWxzL3NvcHMnO1xuaW1wb3J0IHsgZXhlY1N5bmMgfSBmcm9tICdjaGlsZF9wcm9jZXNzJztcblxuaW50ZXJmYWNlIEF1dGhEZXBlbmRlbmNpZXMge1xuXHRsb2dnZXI6IExvZ2dlcjtcblx0VXNlck1vZGVsOiBSZXR1cm5UeXBlPHR5cGVvZiBjcmVhdGVVc2VyTW9kZWw+O1xuXHRqd3RVdGlsOiBSZXR1cm5UeXBlPHR5cGVvZiBjcmVhdGVKd3RVdGlsPjtcblx0YXJnb24yOiB0eXBlb2YgYXJnb24yO1xufVxuXG5leHBvcnQgY29uc3QgbG9naW4gPVxuXHQoeyBsb2dnZXIsIFVzZXJNb2RlbCwgand0VXRpbCB9OiBBdXRoRGVwZW5kZW5jaWVzKSA9PlxuXHRhc3luYyAocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKTogUHJvbWlzZTxSZXNwb25zZSB8IG51bGw+ID0+IHtcblx0XHR0cnkge1xuXHRcdFx0Y29uc3QgeyB1c2VybmFtZSwgcGFzc3dvcmQgfSA9IHJlcS5ib2R5O1xuXHRcdFx0Y29uc3QgdXNlciA9IGF3YWl0IFVzZXJNb2RlbC5maW5kT25lKHsgd2hlcmU6IHsgdXNlcm5hbWUgfSB9KTtcblxuXHRcdFx0aWYgKCF1c2VyKSB7XG5cdFx0XHRcdHJldHVybiByZXNcblx0XHRcdFx0XHQuc3RhdHVzKDQwMSlcblx0XHRcdFx0XHQuanNvbih7IG1zZzogJ0xvZ2luIGZhaWxlZCAtIGludmFsaWQgY3JlZGVudGlhbHMnIH0pO1xuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCBzZWNyZXRzID0gYXdhaXQgc29wcy5nZXRTZWNyZXRzKHtcblx0XHRcdFx0bG9nZ2VyLFxuXHRcdFx0XHRleGVjU3luYyxcblx0XHRcdFx0Z2V0RGlyZWN0b3J5UGF0aDogKCkgPT4gcHJvY2Vzcy5jd2QoKVxuXHRcdFx0fSk7XG5cblx0XHRcdGNvbnN0IGlzUGFzc3dvcmRWYWxpZCA9IGF3YWl0IHVzZXIuY29tcGFyZVBhc3N3b3JkKFxuXHRcdFx0XHRwYXNzd29yZCxcblx0XHRcdFx0YXJnb24yLFxuXHRcdFx0XHRzZWNyZXRzXG5cdFx0XHQpO1xuXG5cdFx0XHRpZiAoIWlzUGFzc3dvcmRWYWxpZCkge1xuXHRcdFx0XHRyZXR1cm4gcmVzLnN0YXR1cyg0MDEpLmpzb24oeyBtc2c6ICdJbnZhbGlkIGNyZWRlbnRpYWxzJyB9KTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gZ2VuZXJhdGUgSldUIHRva2VuIGFuZCB1c2UgaXQgdG8gcmVzcG9uZFxuXHRcdFx0Y29uc3QgdG9rZW4gPSBhd2FpdCBqd3RVdGlsLmdlbmVyYXRlVG9rZW4odXNlcik7XG5cdFx0XHRyZXR1cm4gcmVzLmpzb24oeyB0b2tlbiB9KTtcblx0XHR9IGNhdGNoIChlcnIpIHtcblx0XHRcdGxvZ2dlci5lcnJvcihlcnIpO1xuXHRcdFx0cmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHsgbXNnOiAnU2VydmVyIGVycm9yJyB9KTtcblx0XHR9XG5cdH07XG4iXX0=