declare module 'winston-logstash' {
	import TransportStream from 'winston-transport';

	interface LogstashTransportOptions extends TransportStream.TransportStreamOptions {
		port: number;
		host: string;
		max_connect_retries?: number;
		timeout_connect_retries?: number;
		node_name?: string;
		meta?: object;
	}

	class LogstashTransport extends TransportStream {
		constructor(options: LogstashTransportOptions);
	}

	export = LogstashTransport;
}
