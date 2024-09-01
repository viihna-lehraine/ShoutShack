import debug, { Debugger } from 'debug';
interface DebugUtilDependencies {
    debug: typeof debug;
}
export default function createDebugUtil({ debug }: DebugUtilDependencies): {
    log: Debugger;
    dbLog: Debugger;
    logError: (message: string, error: Error) => void;
};
export {};
//# sourceMappingURL=debug.d.ts.map