import debug, { Debugger } from 'debug';
import { Logger } from './logger';
interface DebugUtilDependencies {
    debug: typeof debug;
    logger: Logger;
}
export default function createDebugUtil({ debug, logger }: DebugUtilDependencies): {
    log: Debugger;
    dbLog: Debugger;
    logError: (message: string, error: Error) => void;
    logInfo: (message: string) => void;
    logWarning: (message: string) => void;
    logVerbose: (message: string) => void;
};
export {};
//# sourceMappingURL=debug.d.ts.map
