import { Request, Response } from 'express';
import { WhereOptions } from 'sequelize';
import { ModelController } from '../index/controllerInterfaces';
import { ModelOperations, ModelType } from '../index/modelInterfaces';

export const getEntries =
	<T extends ModelType>(
		Model: ModelOperations<T>,
		{
			appLogger,
			errorClasses,
			ErrorSeverity,
			ErrorLogger,
			processError
		}: ModelController
	) =>
	async (req: Request, res: Response): Promise<void> => {
		try {
			const entries = await Model.findAll();
			res.status(200).json(entries);
			appLogger.debug(`Fetched all entries from ${Model.name}`);
		} catch (missingResourceError) {
			const resource: string = Model.name;
			const utility: string = 'modelController - getEntries()';
			const resourceError = new errorClasses.MissingResourceError(
				`No ${resource} entries found: ${missingResourceError instanceof Error ? missingResourceError.message : ''}`,
				{
					utility,
					originalError: missingResourceError,
					statusCode: 404,
					severity: ErrorSeverity.INFO,
					exposeToClient: false
				}
			);
			ErrorLogger.logWarning(resourceError.message);
			processError(resourceError);
		}
	};

export const createEntry =
	<T extends ModelType>(
		Model: ModelOperations<T>,
		{ appLogger, errorClasses, ErrorLogger, processError }: ModelController
	) =>
	async (req: Request, res: Response): Promise<void> => {
		try {
			const newEntry = await Model.create(req.body);
			res.status(201).json(newEntry);
			appLogger.debug(`Created a new entry in ${Model.name}`);
		} catch (utilError) {
			const utility: string = 'modelController - createEntry()';
			const utilityError = new errorClasses.UtilityErrorRecoverable(
				`Error occurred with dependency ${utility}: ${utilError instanceof Error ? utilError.message : String(utilError)}`,
				{ exposeToClient: false }
			);
			ErrorLogger.logError(utilityError);
			processError(utilityError);
		}
	};

export const deleteEntry =
	<T extends ModelType>(
		Model: ModelOperations<T>,
		{
			appLogger,
			errorClasses,
			ErrorLogger,
			ErrorSeverity,
			processError
		}: ModelController
	) =>
	async (req: Request, res: Response): Promise<void> => {
		try {
			const { id } = req.params;
			const deleted = await Model.destroy({
				where: { id } as WhereOptions<T>
			});
			if (!deleted) {
				appLogger.debug(`${Model.name} entry with id ${id} not found`);
				res.status(404).json({
					error: `${Model.name} entry not found`
				});
				return;
			}
			res.status(200).json({ message: `${Model.name} entry deleted` });
			appLogger.info(`Deleted ${Model.name} entry with id ${id}`);
		} catch (utilError) {
			const utilityError = new errorClasses.UtilityErrorRecoverable(
				`Error occurred with dependency 'modelController - deleteEntry()\n${utilError instanceof Error ? utilError.message : String(utilError)}`,
				{
					utility: 'modelController - deleteEntry()',
					originalError: utiLError,
					statusCode: 500,
					severity: ErrorSeverity.RECOVERABLE,
					exposeToClient: false
				}
			);
			ErrorLogger.logError(utilityError);
			processError(utilityError);
		}
	};
