declare module 'express-async-errors' {
	import { RequestHandler } from 'express';

	function expressAsyncErrors(handler: RequestHandler): RequestHandler;
	export = expressAsyncErrors;
}
