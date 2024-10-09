import { Request, Response, NextFunction } from 'express';
import { Socket } from 'net';

export const blankRequest: Request = {
	headers: {},
	ip: '',
	socket: {
		remoteAddress: '0.0.0.0'
	} as Socket
} as Request;

export const blankResponse: Response = {
	status: function (statusCode: number): Response {
		console.log(`Status set to: ${statusCode}`);
		return this as Response;
	},
	send: function (body?: any): Response {
		console.log(`Response body: ${body}`);
		return this as Response;
	},
	json: function (body?: any): Response {
		console.log(`Response JSON: ${JSON.stringify(body)}`);
		return this as Response;
	},
	set: function (field: string, value?: string | string[]): Response {
		console.log(`Header set: ${field} = ${value}`);
		return this as Response;
	}
} as unknown as Response;

export const blankNextFunction: NextFunction = function (error?: any): void {
	if (error) {
		console.log(`Next called with error: ${error}`);
	} else {
		console.log('Next function called without error');
	}
};
