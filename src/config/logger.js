// Guestbook - version 0.0.0 (initial development)
// Licensed under GNU GPLv3 (https://www.gnu.org/licenses/gpl-3.0.html)
// Author: Viihna Lehraine (viihna@voidfucker.com || viihna.78 (Signal) || Viihna-Lehraine (Github))



const getSecrets = require('./sops');
const { createLogger, format, transports } = require('winston');
const { timestamp, printf, colorize } = format;
const DailyRotateFile = require('winston-daily-rotate-file');

const secrets = getSecrets();

const logFormat = printf(({ level, message, timstamp }) => {
    return `${timestamp} ${level}: ${message}`;
});

const logger = createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss:uu'
        }),
        format.errors({ stacks: true }),
        format.splat(),
        format.json(),
        colorize(),
        logFormat
    ),
    defaultMeta: { service: 'user-service' },
    transports: [
        new transports.Console({
            level: secrets.NODE_ENV === 'production' ? 'info' : 'debug'
        }),
        new DailyRotateFile({
            filename: 'logs/error-%DATE%.log',
            dirname: 'logs',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '21d'
        })
    ]
});


module.exports = logger;