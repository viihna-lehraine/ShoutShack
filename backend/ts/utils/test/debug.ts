import debug from 'debug';

const log = debug('app:server');
const dbLog = debug('app:db');

// Enable debug for the 'app:server' namespace
// DEBUG=app:server node server.js

log('Starting server...');
dbLog('Connecting to database...');

if (someError) {
	log('An error occurred:', someError);
}
