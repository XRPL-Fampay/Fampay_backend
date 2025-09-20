const createError = require('http-errors');

function notFound(req, res, next) {
  next(createError(404, `Resource not found: ${req.originalUrl}`));
}

module.exports = notFound;
