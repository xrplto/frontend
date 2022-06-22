const bunyan = require('bunyan');

const logger = bunyan.createLogger({
    name: ' ',
    streams: [
    {
        level: 'trace',
        stream: process.stdout
    }]
});

module.exports = options => {
    return {
        info: (...args) => {
            logger.info(...args);
        },
        warn: (...args) => {
            logger.warn(...args);
        },
        error: (...args) => {
            logger.error(...args);
        },
        debug: (...args) => {
            logger.debug(...args);
      },
    };
};
