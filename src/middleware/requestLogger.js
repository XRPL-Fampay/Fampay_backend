const morgan = require('morgan');

function requestLogger() {
  return morgan('dev');
}

module.exports = requestLogger;
