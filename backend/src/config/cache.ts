export const serviceTTLConfig: Record<string, number> = {
	APIRouter: 180,
	CSRF: 30,
	DatabaseController: 60,
	FIDO2Service: 30,
	JWTService: 30,
	ResourceManager: 5,
	StaticRouter: 120,
	TOTPService: 30,
	YubicoOTPService: 30,
	default: 30
};
