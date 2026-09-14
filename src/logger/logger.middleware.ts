import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      const status = res.statusCode;

      const timestamp = new Date().toLocaleString('en-US', {
        timeZone: 'Asia/Ho_Chi_Minh',
        hour12: true,
      });

      let color = '\x1b[32m';

      if (status >= 500) {
        color = '\x1b[31m';
      } else if (status >= 400) {
        color = '\x1b[33m';
      } else if (status >= 300) {
        color = '\x1b[36m';
      }

      console.log(
        `${color}[LOG] - ${timestamp} ${req.method} ${req.originalUrl} ${status} - ${duration}ms\x1b[0m`,
      );
    });

    next();
  }
}