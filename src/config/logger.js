// Guestbook - version 0.0.0 (initial development)
// Licensed under GNU GPLv3 (https://www.gnu.org/licenses/gpl-3.0.html)
// Author: Viihna Lehraine (viihna@viihnatech.com || viihna.78 (Signal) || Viihna-Lehraine (Github))



const { createLogger, format, transports } = require('winston');
const { timestamp, printf, colorize } = format;
const DailyRotateFile = require('winston-daily-rotate-file');
const { getSecrets } = require('./sops');


async function setupLogger() {
    const secrets = await getSecrets();

    const logFormat = printf(({ level, message, timestamp }) => {
        return `${timestamp} ${level}: ${message}`;
    });

    const logger = createLogger({
        level: 'info',
        format: format.combine(
            format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:uu' }),
            format.errors({ stack: true }),
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

    return logger;
}


module.exports = setupLogger();