import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

export const winstonConfig = {
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: 'logs/app.log',
      format: winston.format.json(),
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.json(),
    }),
  ],
};

export const createWinstonLogger = () => {
  return WinstonModule.createLogger(winstonConfig);
};
