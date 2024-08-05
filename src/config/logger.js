const getSecrets = require('./sops');
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, colorize } = format;
const DailyRotateFile = require('winston-daily-rotate-file');

const secrets = getSecrets();

const logFormat = printf(({ level, message, timstamp }) => {
    return `${timestamp} ${level}: ${message}`;
});

const logger = createLogger({
    format: combine(
        timestamp(),
        colorize(),
        logFormat
    ),
    transports: [
        new transports.Console({
            level: secrets.NODE_ENV === 'production' ? 'info' : 'debug'
        }),
        new DailyRotateFile({
            filename: 'logs/error-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            level: 'error'
        }),
        new DailyRotateFile({
            filename: 'logs/combined-%DATE%.log',
            datePattern: 'YYYY-MM-DD'
        })
    ]
});

module.exports = logger;