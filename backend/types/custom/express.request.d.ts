import { User as CustomUser } from '../../src/models/UserModelFile';

declare global {
	namespace Express {
	  interface User {
		id: string;
		userId: number;
		username: string;
		password: string;
		email: string;
		isVerified: boolean;
		resetPasswordToken: string | null;
		resetPasswordExpires: Date | null;
		isMfaEnabled: boolean;
		creationDate: Date;
		}

		interface Request {
			user?: User;
		}
	}
}
