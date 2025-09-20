function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  const status = err.status || 500;
  const payload = {
    error: {
      message: err.message || 'Internal Server Error'
    }
  };

  if (err.errors) {
    payload.error.details = err.errors;
  }

  if (req.app.get('env') !== 'production' && err.stack) {
    payload.error.stack = err.stack.split('\n');
  }

  res.status(status);

  if (req.accepts('json')) {
    res.json(payload);
    return;
  }

  res.type('txt').send(payload.error.message);
}

module.exports = errorHandler;
