import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

let logDir = path.resolve('data/logs/server/startup');
let logNumber = (fs.readdirSync(logDir).length + 1);
let timestamp = new Date().toISOString().replace(/[:.]/g, '-');
let logFilePath = path.join(logDir, `startupLog-${logNumber}.log`);

function runServerAndLog() {
  const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });
  logStream.write(`\n----- TIMESTAMP -----\n${timestamp}\n\n`);

  const serverProcess = spawn('node', ['src/server.js'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    detached: false,
  });

  serverProcess.stdout.pipe(logStream);
  serverProcess.stderr.pipe(logStream);

  serverProcess.on('close', (code) => {
    logStream.write(`\n----- SERVER EXITED WITH CODE: ${code} -----\n`);
    logStream.end();
    console.log('Server startup log written to:', logFilePath);
  });

  serverProcess.on('error', (error) => {
    logStream.write(`\n----- EXECUTION ERROR -----\n${error.message}\n`);
    logStream.end();
    console.error('Failed to start server. Log written to:', logFilePath);
  });
}

runServerAndLog();

// # # # # # # # # # # # # # # # # # # # # # # # # # //

/* V1
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

let logDir = path.resolve('data/logs/server/startup');
let logNumber = (fs.readdirSync(logDir).length + 1);
let timestamp = new Date().toISOString().replace(/[:.]/g, '-');
let logFilePath = path.join(logDir, `startupLog-${logNumber}.log`);

function runServerAndLog() {
  const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });
  logStream.write(`\n----- TIMESTAMP -----\n${timestamp}\n\n`);

  const serverProcess = spawn('node', ['src/server.js'], { stdio: 'pipe' });

  serverProcess.stdout.on('data', (data) => {
    logStream.write(`----- SERVER STARTUP OUTPUT -----\n${data}\n`);
  });

  serverProcess.stderr.on('data', (data) => {
    logStream.write(`----- SERVER STARTUP ERRORS -----\n${data}\n`);
  });

  serverProcess.on('close', (code) => {
    logStream.write(`\n----- SERVER EXITED WITH CODE: ${code} -----\n`);
    logStream.end();
    console.log('Server startup log written to:', logFilePath);
  });

  serverProcess.on('error', (error) => {
    logStream.write(`\n----- EXECUTION ERROR -----\n${error.message}\n`);
    logStream.end();
    console.error('Failed to start server. Log written to:', logFilePath);
  });
}

runServerAndLog();
*/
