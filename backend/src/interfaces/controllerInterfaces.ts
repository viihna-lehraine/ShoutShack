export interface AuthController {
	argon2: typeof import('argon2');
	execSync: typeof import('child_process').execSync;
	jwt: typeof import('jsonwebtoken');
	req: import('express').Request;
	res: import('express').Response;
	appLogger: import('../services/appLogger').AppLogger;
	createJwt: typeof import('../auth/jwt').createJwt;
	errorClasses: typeof import('../errors/errorClasses').errorClasses;
	ErrorLogger: import('../services/errorLogger').ErrorLogger;
	ErrorSeverity: typeof import('../errors/errorClasses').ErrorSeverity;
	processError: typeof import('../errors/processError').processError;
	sendClientErrorResponse: typeof import('../errors/processError').sendClientErrorResponse;
	UserModel: typeof import('../models/UserModelFile').User;
	validateDependencies: typeof import('../utils/helpers').validateDependencies;
}

export interface ModelController {
	appLogger: import('../services/appLogger').AppLogger;
	ErrorLogger: import('../services/errorLogger').ErrorLogger;
	errorClasses: typeof import('../errors/errorClasses').errorClasses;
	ErrorSeverity: typeof import('../errors/errorClasses').ErrorSeverity;
	processError: typeof import('../errors/processError').processError;
}
