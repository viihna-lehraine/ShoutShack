export const serviceTTLConfig: Record<string, number> = {
	APIRouter: 180,
	CSRF: 30,
	DatabaseController: 60,
	FIDO2Service: 30,
	JWTService: 30,
	HealthRouter: 300,
	ResourceManager: 5,
	StaticRouter: 300,
	TOTPService: 30,
	YubicoOTPService: 30,
	default: 60
};

export const fileCacheTTLConfig: Record<string, number> = {
	'.css': 300,
	'.gif': 600,
	'.html': 60,
	'.ico': 600,
	'.jpg': 600,
	'.js': 300,
	'.jpeg': 600,
	'.png': 600,
	'.svg': 1200,
	'.txt': 600,
	'.xml': 120,
	'default': 300
};
