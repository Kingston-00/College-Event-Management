/** Helper to create errors carrying a status code. */
const httpError = (statusCode, message) => Object.assign(new Error(message), { statusCode });

const notFound = (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
};

// Central error handler: maps common Mongoose/JWT errors to HTTP codes.
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let status = err.statusCode || 500;
  let message = err.message || 'Server error';

  if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid identifier';
  } else if (err.code === 11000) {
    status = 409;
    message = `${Object.keys(err.keyValue || {})[0] || 'Value'} already exists`;
  } else if (err.name === 'ValidationError') {
    status = 422;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  } else if (err.message === 'Origin not allowed by CORS') {
    status = 403;
  }

  if (status >= 500) console.error(err);
  res.status(status).json({ message: status >= 500 ? 'Server error' : message });
};

module.exports = { httpError, notFound, errorHandler };
