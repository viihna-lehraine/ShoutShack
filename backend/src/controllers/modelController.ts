import { Request, Response } from 'express';
import { Model, WhereOptions } from 'sequelize';
import setupLogger from '../config/logger';

// Define a generic type for models
interface ModelType extends Model {
	id?: number | string;
}

const logger = setupLogger();

// Retrieve all entries for any model
export const getEntries =
	<T extends ModelType>(Model: {
		new (): T;
		findAll: () => Promise<T[]>;
	}): ((req: Request, res: Response) => Promise<void>) =>
	async (req: Request, res: Response): Promise<void> => {
		try {
			const entries = await Model.findAll();
			res.status(200).json(entries);
		} catch (error) {
			logger.error(error);
			res.status(500).json({
				error: `Failed to fetch entries from ${Model.name}`
			});
		}
	};

// Create a new entry for any model
export const createEntry =
	<T extends ModelType>(Model: {
		new (): T;
		create: (values: object) => Promise<T>;
	}): ((req: Request, res: Response) => Promise<void>) =>
	async (req: Request, res: Response): Promise<void> => {
		try {
			const newEntry = await Model.create(req.body);
			res.status(201).json(newEntry);
		} catch (error) {
			logger.error(error);
			res.status(400).json({
				error: `Failed to create entry in ${Model.name}`
			});
		}
	};

// Update an existing entry for any model
export const updateEntry =
	<T extends ModelType>(Model: {
		new (): T;
		update: (
			values: object,
			options: { where: WhereOptions<T> }
		) => Promise<[number, T[]]>;
	}): ((req: Request, res: Response) => Promise<void>) =>
	async (req: Request, res: Response): Promise<void> => {
		try {
			const { id } = req.params;
			const updatedEntry = await Model.update(req.body, {
				where: { id } as WhereOptions<T>
			});
			if (updatedEntry[0] === 0) {
				res.status(404).json({
					error: `${Model.name} entry not found`
				});
				return;
			}
			res.status(200).json({ message: `${Model.name} entry updated` });
		} catch (error) {
			logger.error(error);
			res.status(400).json({
				error: `Failed to update entry in ${Model.name}`
			});
		}
	};

// Delete an entry for any model
export const deleteEntry =
	<T extends ModelType>(Model: {
		new (): T;
		destroy: (options: { where: WhereOptions<T> }) => Promise<number>;
	}): ((req: Request, res: Response) => Promise<void>) =>
	async (req: Request, res: Response): Promise<void> => {
		try {
			const { id } = req.params;
			const deleted = await Model.destroy({
				where: { id } as WhereOptions<T>
			});
			if (!deleted) {
				res.status(404).json({
					error: `${Model.name} entry not found`
				});
				return;
			}
			res.status(200).json({ message: `${Model.name} entry deleted` });
		} catch (error) {
			logger.error(error);
			res.status(500).json({
				error: `Failed to delete entry from ${Model.name}`
			});
		}
	};
