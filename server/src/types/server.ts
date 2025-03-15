// File: server/src/types/server.ts

export type CronJob = {
	schedule: string;
	task: () => Promise<void> | void;
};

export interface Database {
	users: {
		id?: number;
		email: string;
		password: string;
		verified: boolean;
		verification_token: string | null;
		created_at?: Date;
	};
}

export interface MutexContract {
	lock(): Promise<void>;
	unlock(): void;
}

export interface StaticParams {
	'*': string;
}

export interface Utilities {
	parseBoolean: (value: string | undefined) => boolean;
	parseNumber: (value: string | undefined) => number;
	parseString: (value: string | undefined, envVarName: string) => string;
}
