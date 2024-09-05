import { Sequelize } from 'sequelize';
import { Models } from './loadModels';
import { Logger } from '../config/logger';
export declare function initializeModels(sequelize: Sequelize, logger: Logger): Promise<Models>;
export declare function getModels(): Promise<Models>;
//# sourceMappingURL=ModelsIndex.d.ts.map