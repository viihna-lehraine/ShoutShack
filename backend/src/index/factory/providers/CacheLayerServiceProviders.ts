import { CacheService } from '../../../services/Cache';
import { RedisService } from '../../../services/Redis';
import {
	CacheServiceInterface,
	RedisServiceDeps,
	RedisServiceInterface
} from '../../interfaces/main';
import { NextFunction, Request, Response } from 'express';

export class CacheServiceProvider {
	private static instance: CacheServiceInterface | null = null;

	public static async getCacheService(): Promise<CacheServiceInterface> {
		if (!this.instance) {
			this.instance = await CacheService.getInstance();
		}
		return this.instance;
	}
}

export class RedisServiceProvider {
	private static instance: RedisServiceInterface | null = null;

	private static async loadRedisDeps(): Promise<RedisServiceDeps> {
		const expressModule = await import('express');
		const redisModule = await import('redis');
		const helpersModule = await import('../../../utils/helpers');
		const expressConfigModule = await import('../../../config/express');

		return {
			req: expressModule.request as Request,
			res: expressModule.response as Response,
			next: (() => {}) as NextFunction,
			createRedisClient: redisModule.createClient,
			validateDependencies: helpersModule.validateDependencies,
			blankRequest: expressConfigModule.blankRequest
		};
	}

	public static async getRedisService(): Promise<RedisServiceInterface> {
		if (!this.instance) {
			const deps = await this.loadRedisDeps();
			this.instance = await RedisService.getInstance(deps);
		}

		return this.instance;
	}
}
