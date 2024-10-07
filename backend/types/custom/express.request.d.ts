import { User as CustomUser } from '../../src/models/User';

declare global {
	namespace Express {
	  interface User {
		id: string;
		userId?: number | undefined;
		username: string;
		password: string;
		email: string;
		isVerified: boolean;
		resetPasswordToken: string | null;
		resetPasswordExpires: Date | null;
		isMFAEnabled: boolean;
		creationDate: Date;
		}

		interface Request {
			user?: User;
		}
	}
}
