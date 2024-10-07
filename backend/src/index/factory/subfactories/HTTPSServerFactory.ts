import { HTTPSServerInterface } from '../../interfaces/main';
import { HTTPSServerProvider } from '../providers/HTTPSServerProvider';

export class HTTPSServerFactory {
	public static async getHTTPSServer(): Promise<HTTPSServerInterface> {
		return await HTTPSServerProvider.getHTTPSServer();
	}
}
