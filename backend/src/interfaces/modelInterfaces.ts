import { Model } from 'sequelize';

export interface ModelType extends Model {
	id?: number | string;
}

export interface ModelOperations<T> {
	new (): T;
	findAll: () => Promise<T[]>;
	create: (values: Partial<T>) => Promise<T>;
	destroy: (options: { where: { id: number } }) => Promise<number>;
}
