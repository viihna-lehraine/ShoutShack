import { Request, Response } from 'express';
import { Model, WhereOptions } from 'sequelize';
import { errorClasses } from '../errors/errorClasses';
import { ErrorLogger } from '../errors/errorLogger';
import { processError } from '../errors/processError';
import { Logger } from '../utils/appLogger';
import { validateDependencies } from '../utils/validateDependencies';

interface ModelType extends Model {
	id?: number | string;
}

interface ModelControllerDependencies {
	logger: Logger;
}

export const getEntries =
	<T extends ModelType>(
		Model: { new (): T; findAll: () => Promise<T[]> },
		{ logger }: ModelControllerDependencies
	) =>
	async (req: Request, res: Response): Promise<void> => {
		try {
			validateDependencies(
				[{ name: 'logger', instance: logger }],
				logger || console
			);
			const entries = await Model.findAll();
			res.status(200).json(entries);
			logger.debug(`Fetched all entries from ${Model.name}`);
		} catch (missingResourceError) {
			const resource: string = Model.name;
			const utility: string = 'modelController - getEntries()';
			const resourceError = new errorClasses.MissingResourceError(
				`No ${resource} entries found: ${missingResourceError instanceof Error ? missingResourceError.message : ''}`,
				{ utility, exposeToClient: false }
			);
			ErrorLogger.logWarning(resourceError.message, logger);
			processError(resourceError, logger);
		}
	};

export const createEntry =
	<T extends ModelType>(
		Model: { new (): T; create: (values: Partial<T>) => Promise<T> },
		{ logger }: ModelControllerDependencies
	) =>
	async (req: Request, res: Response): Promise<void> => {
		try {
			const newEntry = await Model.create(req.body);
			res.status(201).json(newEntry);
			logger.debug(`Created a new entry in ${Model.name}`);
		} catch (utilError) {
			const utility: string = 'modelController - createEntry()';
			const utilityError = new errorClasses.UtilityErrorRecoverable(
				`Error occurred with dependency ${utility}: ${utilError instanceof Error ? utilError.message : String(utilError)}`,
				{ exposeToClient: false }
			);
			ErrorLogger.logError(utilityError, logger);
			processError(utilityError, logger);
		}
	};

export const deleteEntry =
	<T extends ModelType>(
		Model: {
			new (): T;
			destroy: (options: { where: WhereOptions<T> }) => Promise<number>;
		},
		{ logger }: ModelControllerDependencies
	) =>
	async (req: Request, res: Response): Promise<void> => {
		try {
			const { id } = req.params;
			const deleted = await Model.destroy({
				where: { id } as WhereOptions<T>
			});
			if (!deleted) {
				logger.debug(`${Model.name} entry with id ${id} not found`);
				res.status(404).json({
					error: `${Model.name} entry not found`
				});
				return;
			}
			res.status(200).json({ message: `${Model.name} entry deleted` });
			logger.info(`Deleted ${Model.name} entry with id ${id}`);
		} catch (utiLError) {
			const utility: string = 'modelController - deleteEntry()';
			const utilityError = new errorClasses.UtilityErrorRecoverable(
				`Error occurred with dependency ${utility}: ${utiLError instanceof Error ? utiLError.message : String(utiLError)}`,
				{ exposeToClient: false }
			);
			ErrorLogger.logError(utilityError, logger);
			processError(utilityError, logger);
		}
	};
