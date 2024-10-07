import express from 'express';
import { HTTPSServer } from '../../../services/HTTPS';
import { HTTPSServerInterface } from '../../interfaces/main';
import { DatabaseControllerFactory } from '../subfactories/DatabaseControllerFactory';
import { ErrorHandlerServiceFactory } from '../subfactories/ErrorHandlerServiceFactory';

let expressApp: express.Application;

export class HTTPSServerProvider {
	private static instance: Promise<HTTPSServerInterface> | null = null;

	public static async getHTTPSServer(): Promise<HTTPSServerInterface> {
		if (!this.instance) {
			const databaseController =
				await DatabaseControllerFactory.getDatabaseController();
			const sequelize = databaseController.getSequelizeInstance();
			const errorHandler =
				await ErrorHandlerServiceFactory.getErrorHandlerService();

			if (!sequelize) {
				const HTTPSServerError =
					new errorHandler.ErrorClasses.DatabaseErrorRecoverable(
						'Unable to start web server, as the sequelize instance is not initialized.',
						{ exposeToClient: false }
					);
				errorHandler.handleError({
					error: HTTPSServerError,
					details: {
						context: 'WEB_SERVER',
						reason: 'Sequelize instance not initialized'
					}
				});
				throw HTTPSServerError;
			}

			this.instance = HTTPSServer.getInstance(expressApp, sequelize);
		}

		return this.instance;
	}
}
