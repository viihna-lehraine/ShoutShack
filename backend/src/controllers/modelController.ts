import { Request, Response } from 'express';
import { Model, WhereOptions } from 'sequelize';
import { Logger } from '../config/logger';

interface ModelType extends Model {
	id?: number | string;
}

interface ModelControllerDependencies {
	logger: Logger;
}

// Retrieve all entries for any model
export const getEntries =
	<T extends ModelType>(
		Model: { new (): T; findAll: () => Promise<T[]> },
		{ logger }: ModelControllerDependencies
	) =>
	async (req: Request, res: Response): Promise<void> => {
		try {
			const entries = await Model.findAll();
			res.status(200).json(entries);
			logger.info(`Fetched all entries from ${Model.name}`);
		} catch (error) {
			if (error instanceof Error) {
				logger.error(
					`Failed to fetch entries from ${Model.name}: ${error.message}`
				);
			} else {
				logger.error(
					`Failed to fetch entries from ${Model.name}: ${String(error)}`
				);
			}
			res.status(500).json({
				error: `Failed to fetch entries from ${Model.name} model`
			});
		}
	};

// Create a new entry for any model
export const createEntry =
	<T extends ModelType>(
		Model: { new (): T; create: (values: Partial<T>) => Promise<T> },
		{ logger }: ModelControllerDependencies
	) =>
	async (req: Request, res: Response): Promise<void> => {
		try {
			const newEntry = await Model.create(req.body);
			res.status(201).json(newEntry);
			logger.info(`Created a new entry in ${Model.name}`);
		} catch (error) {
			if (error instanceof Error) {
				logger.error(
					`Failed to create a new entry in ${Model.name}: ${error.message}`
				);
			} else {
				logger.error(
					`Failed to create a new entry in ${Model.name}: ${String(error)}`
				);
			}
			res.status(400).json({
				error: `Failed to create a new entry in ${Model.name}`
			});
		}
	};

// Delete an entry for any model
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
				logger.warn(`${Model.name} entry with id ${id} not found`);
				res.status(404).json({
					error: `${Model.name} entry not found`
				});
				return;
			}
			res.status(200).json({ message: `${Model.name} entry deleted` });
			logger.info(`Deleted ${Model.name} entry with id ${id}`);
		} catch (error) {
			if (error instanceof Error) {
				logger.error(
					`Failed to delete entry from ${Model.name}: ${error.message}`
				);
			} else {
				logger.error(
					`Failed to delete entry from ${Model.name}: ${String(error)}`
				);
			}
			res.status(500).json({
				error: `Failed to delete entry from ${Model.name}`
			});
		}
	};
