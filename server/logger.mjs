import pino from 'pino';

export function newLogger(config) {
  const options = {
    level: config.logger.level,
  };
  if (config.logger.pretty) {
    options.transport = {
      target: 'pino-pretty',
      options: {
        colorize: true,
      },
    };
  }
  const l = pino(options);

  return {
    debug: (msg, ...args) => l.debug({ msg, args }),
    info : (msg, ...args) => l.info({ msg, args }),
    warn : (msg, ...args) => l.warn({ msg, args }),
    error: (msg, ...args) => l.error({ msg, args }),
  };
}
