import os from 'os';
import { Logger } from '../config/logger';
interface MemoryMonitorDependencies {
    logger: Logger;
    os: typeof os;
    process: NodeJS.Process;
    setInterval: typeof setInterval;
}
export declare function createMemoryMonitor({ logger, os, process, setInterval }: MemoryMonitorDependencies): {
    startMemoryMonitor: () => NodeJS.Timeout;
};
export {};
//# sourceMappingURL=memoryMonitor.d.ts.map