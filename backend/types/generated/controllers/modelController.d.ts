import { Request, Response } from 'express';
import { Model, WhereOptions } from 'sequelize';
interface ModelType extends Model {
    id?: number | string;
}
interface Logger {
    error: (msg: string, meta?: unknown) => void;
    info: (msg: string, meta?: unknown) => void;
}
interface ModelControllerDependencies {
    logger: Logger;
}
export declare const getEntries: <T extends ModelType>(Model: {
    new (): T;
    findAll: () => Promise<T[]>;
}, { logger }: ModelControllerDependencies) => (req: Request, res: Response) => Promise<void>;
export declare const createEntry: <T extends ModelType>(Model: {
    new (): T;
    create: (values: Partial<T>) => Promise<T>;
}, { logger }: ModelControllerDependencies) => (req: Request, res: Response) => Promise<void>;
export declare const deleteEntry: <T extends ModelType>(Model: {
    new (): T;
    destroy: (options: {
        where: WhereOptions<T>;
    }) => Promise<number>;
}, { logger }: ModelControllerDependencies) => (req: Request, res: Response) => Promise<void>;
export {};
//# sourceMappingURL=modelController.d.ts.map