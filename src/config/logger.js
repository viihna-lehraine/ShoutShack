const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, colorize, errors, json } = format;
const DailyRotateFile = require('winston-daily-rotate-file');
const { getSecrets } = require('./secrets');

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp}, ${level}: ${stack || message}`;
});

async function setupLogger() {
  const secrets = await getSecrets();
  const logger = createLogger({
    level: secrets.NODE_ENV === 'production' ? 'info' : 'debug',
    format: combine(
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      errors({ stack: true }),
      json(),
    ),
    defaultMeta: { service: 'guestbook-service' },
    transports: [
      new transports.Console({
        format: combine(colorize(), logFormat),
      }),
      new DailyRotateFile({
        filename: 'logs/error-%DATE%.log',
        dirname: 'logs',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d',
        format: logFormat,
      }),
    ],
  });

  return logger;
}

module.exports = setupLogger;
