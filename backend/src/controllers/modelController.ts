import { Request, Response } from 'express';
import {
	ModelControllerInterface,
	ModelOperations,
	ModelType
} from '../index/interfaces';

export const getEntries =
	<T extends ModelType>(
		Model: ModelOperations<T>,
		{ configService, errorHandler }: ModelControllerInterface
	) =>
	async (req: Request, res: Response): Promise<void> => {
		try {
			const logger = configService.getAppLogger();

			const entries = await Model.findAll();
			res.status(200).json(entries);
			logger.debug(`Fetched all entries from ${Model.name}`);
		} catch (missingResourceError) {
			const resource: string = Model.name;
			const utility: string = 'modelController - getEntries()';
			const resourceError =
				new errorHandler.ErrorClasses.MissingResourceError(
					`No ${resource} entries found: ${missingResourceError instanceof Error ? missingResourceError.message : ''}`,
					{
						utility,
						originalError: missingResourceError
					}
				);
			configService.getErrorLogger().logWarn(resourceError.message);
			errorHandler.handleError({ error: resourceError });
		}
	};

export const createEntry =
	<T extends ModelType>(
		Model: ModelOperations<T>,
		{ configService, errorHandler }: ModelControllerInterface
	) =>
	async (req: Request, res: Response): Promise<void> => {
		try {
			const newEntry = await Model.create(req.body);
			res.status(201).json(newEntry);
			configService
				.getAppLogger()
				.debug(`Created new entry in ${Model.name}`);
		} catch (utilError) {
			const utility: string = 'modelController - createEntry()';
			const utilityError =
				new errorHandler.ErrorClasses.UtilityErrorRecoverable(
					`Error occurred with dependency ${utility}: ${utilError instanceof Error ? utilError.message : String(utilError)}`,
					{ exposeToClient: false }
				);
			configService.getErrorLogger().logError(utilityError.message);
			errorHandler.handleError({ error: utilityError });
		}
	};

export const deleteEntry =
	<T extends ModelType>(
		Model: ModelOperations<T>,
		{ configService, errorHandler }: ModelControllerInterface
	) =>
	async (req: Request, res: Response): Promise<void> => {
		const logger = configService.getAppLogger();

		try {
			const { id } = req.params;
			const parsedId = Number(id);

			if (isNaN(parsedId)) {
				logger.debug(`Invalid id: ${id}`);
				res.status(400).json({
					error: 'Invalid id'
				});
				return;
			}

			const whereClause: { id: number } = { id: parsedId };

			const deleted = await Model.destroy({
				where: whereClause
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
		} catch (utilError) {
			const utilityError =
				new errorHandler.ErrorClasses.UtilityErrorRecoverable(
					`Error occurred with dependency 'modelController - deleteEntry()\n${utilError instanceof Error ? utilError.message : String(utilError)}`,
					{
						utility: 'modelController - deleteEntry()',
						originalError: utilError
					}
				);
			configService.getErrorLogger().logError(utilityError.message);
			errorHandler.handleError({ error: utilityError });
		}
	};
