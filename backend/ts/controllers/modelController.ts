import { Request, Response } from 'express';
import { Model, WhereOptions } from 'sequelize';

// Define a generic type for models
interface ModelType extends Model {
  id?: number | string;
}

// Retrieve all entries for any model
export const getEntries = <T extends ModelType>(Model: { new(): T; findAll: () => Promise<T[]>; }) => async (req: Request, res: Response) => {
	try {
		const entries = await Model.findAll();
		res.status(200).json(entries);
	} catch (error) {
		res.status(500).json({ error: `Failed to fetch entries from ${Model.name}` });
	}
};

// Create a new entry for any model
export const createEntry = <T extends ModelType>(Model: { new(): T; create: (values: object) => Promise<T>; }) => async (req: Request, res: Response) => {
	try {
		const newEntry = await Model.create(req.body);
		res.status(201).json(newEntry);
	} catch (error) {
		res.status(400).json({ error: `Failed to create entry in ${Model.name}` });
	}
};

// Update an existing entry for any model
export const updateEntry = <T extends ModelType>(Model: { new(): T; update: (values: object, options: { where: WhereOptions<T>; }) => Promise<[number, T[]]>; }) => async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const updatedEntry = await Model.update(req.body, {
			where: { id } as WhereOptions<T>,
		});
		if (updatedEntry[0] === 0) {
			return res.status(404).json({ error: `${Model.name} entry not found` });
		}
		res.status(200).json({ message: `${Model.name} entry updated` });
	} catch (error) {
		res.status(400).json({ error: `Failed to update entry in ${Model.name}` });
	}

	return;  // unreachable code, but satisifies TypeScript
};

// Delete an entry for any model
export const deleteEntry = <T extends ModelType>(Model: { new(): T; destroy: (options: { where: WhereOptions<T>; }) => Promise<number>; }) => async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const deleted = await Model.destroy({ where: { id } as WhereOptions<T> });
		if (!deleted) {
			return res.status(404).json({ error: `${Model.name} entry not found` });
		}
		res.status(200).json({ message: `${Model.name} entry deleted` });
	} catch (error) {
		res.status(500).json({ error: `Failed to delete entry from ${Model.name}` });
	}

	return; // unreachable code, but satisifies TypeScript
};
