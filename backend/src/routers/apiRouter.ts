import { BaseRouter } from './baseRouter';
import { Request, Response, NextFunction } from 'express';
import { UserServiceInterface } from '../index/interfaces';

export class APIRouter extends BaseRouter {
	private static instance: APIRouter | null = null;
	private userService: UserServiceInterface;

	constructor(userService: UserServiceInterface) {
		super();
		this.userService = userService;
		this.setUpRoutes();
	}

	public static getInstance(userService: UserServiceInterface): APIRouter {
		if (!APIRouter.instance) {
			APIRouter.instance = new APIRouter(userService);
		}

		return APIRouter.instance;
	}

	private setUpRoutes(): void {
		this.router.post(
			'/register',
			this.asyncHandler(this.registerUser.bind(this))
		);
		this.router.post(
			'/login',
			this.asyncHandler(this.loginUser.bind(this))
		);
		this.router.post(
			'/recover-password',
			this.asyncHandler(this.recoverPassword.bind(this))
		);
		this.router.post(
			'/generate-totp',
			this.asyncHandler(this.generateTOTP.bind(this))
		);
		this.router.post(
			'/verify-totp',
			this.asyncHandler(this.verifyTOTP.bind(this))
		);
		this.router.post(
			'/generate-email-2fa',
			this.asyncHandler(this.generateEmail2FA.bind(this))
		);
		this.router.post(
			'/verify-email-2fa',
			this.asyncHandler(this.verifyEmail2FA.bind(this))
		);
	}

	private async registerUser(
		req: Request,
		res: Response
	): Promise<Response | void> {
		try {
			const { username, email, password, confirmPassword } = req.body;

			if (password !== confirmPassword) {
				return res.status(400).json({
					password: 'Registration failure: passwords do not match'
				});
			}

			await this.userService.createUser({
				username,
				email,
				password,
				isVerified: false,
				isMfaEnabled: false
			});

			this.logger.debug(`User ${username} registered successfully`);

			return res.json({
				message: 'Account registered! Please confirm via email.'
			});
		} catch (err) {
			this.errorHandler.handleError({
				error: err || 'User registration failed'
			});
			return res.status(500).json({
				error: 'Registration failed. Please try again.'
			});
		}
	}

	private async loginUser(
		req: Request,
		res: Response
	): Promise<Response | void> {
		try {
			this.logger.debug(`Login request received`);

			const response = await this.userService.loginUser(req, res);
			return response;
		} catch (err) {
			this.errorHandler.handleError({
				error: err || 'Login failed'
			});
			return res.status(500).json({ error: 'Login - Server error' });
		}
	}

	private async recoverPassword(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> {
		const { email } = req.body;
		try {
			await this.userService.recoverPassword(email);
			return res.json({
				message: `Password reset link sent to ${email}`
			});
		} catch (err) {
			this.errorHandler.expressErrorHandler()(
				err as Error,
				req,
				res,
				next
			);
			return res.status(500).json({
				error: 'Password recovery failed due to an unknown error. Please try again.'
			});
		}
	}

	private async generateEmail2FA(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> {
		const { email } = req.body;
		try {
			await this.userService.generateEmail2FA(email);
			return res.json({ message: '2FA code sent to email' });
		} catch (err) {
			this.errorHandler.expressErrorHandler()(
				err as Error,
				req,
				res,
				next
			);
			return res.status(500).json({
				error: 'Generate 2FA: internal server error'
			});
		}
	}

	private async verifyEmail2FA(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> {
		const { email, email2FACode } = req.body;
		try {
			const isEmail2FACodeValid = await this.userService.verifyEmail2FA(
				email,
				email2FACode
			);
			if (!isEmail2FACodeValid) {
				return res
					.status(400)
					.json({ error: 'Invalid or expired 2FA code' });
			}
			return res.json({ message: '2FA code verified successfully' });
		} catch (err) {
			this.errorHandler.expressErrorHandler()(
				err as Error,
				req,
				res,
				next
			);
			return res.status(500).json({ error: 'Internal server error' });
		}
	}

	private async generateTOTP(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> {
		try {
			const { userId } = req.body;
			const { secret, qrCodeUrl } =
				await this.userService.generateTOTP(userId);
			return res.json({ secret, qrCodeUrl });
		} catch (err) {
			this.handleRouteError(err as Error, req, res, next);
			return res.status(500).json({
				error: 'Unable to generate TOTP secret. Please try again.'
			});
		}
	}

	private async verifyTOTP(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<Response | void> {
		const { userId, token } = req.body;
		try {
			const isTOTPTokenValid = await this.userService.verifyTOTP(
				userId,
				token
			);
			return res.json({ isTOTPTokenValid });
		} catch (err) {
			this.handleRouteError(err as Error, req, res, next);
			return res.status(500).json({
				error: 'Unable to verify TOTP token. Please try again.'
			});
		}
	}
}
