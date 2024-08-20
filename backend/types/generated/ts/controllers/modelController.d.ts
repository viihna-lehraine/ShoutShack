import { Request, Response } from 'express';
import { Model, WhereOptions } from 'sequelize';
interface ModelType extends Model {
    id?: number | string;
}
export declare const getEntries: <T extends ModelType>(Model: {
    new (): T;
    findAll: () => Promise<T[]>;
}) => (req: Request, res: Response) => Promise<void>;
export declare const createEntry: <T extends ModelType>(Model: {
    new (): T;
    create: (values: object) => Promise<T>;
}) => (req: Request, res: Response) => Promise<void>;
export declare const updateEntry: <T extends ModelType>(Model: {
    new (): T;
    update: (values: object, options: {
        where: WhereOptions<T>;
    }) => Promise<[number, T[]]>;
}) => (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteEntry: <T extends ModelType>(Model: {
    new (): T;
    destroy: (options: {
        where: WhereOptions<T>;
    }) => Promise<number>;
}) => (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export {};
//# sourceMappingURL=modelController.d.ts.map