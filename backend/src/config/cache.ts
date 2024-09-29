export const serviceTTLConfig: Record<string, number> = {
	APIRouter: 180,
	DatabaseController: 60,
	ResourceManager: 5,
	StaticRouter: 120,
	default: 30
};
