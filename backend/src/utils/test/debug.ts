import debug from 'debug';

let log = debug('app:server');
let dbLog = debug('app:db');

// Enable debug for the 'app:server' namespace
// DEBUG=app:server node server.js

log('Starting server...');
dbLog('Connecting to database...');

// Example error // *DEV-NOTE* rip this out and replace when configuring debug.ts funcionality //
let someError = new Error(
	'ERROR: BOTTOM TEXT NOT FOUND! ARE YOU A SUBSCRIBER?'
);

if (someError) {
	log('An error occurred:', someError);
}
