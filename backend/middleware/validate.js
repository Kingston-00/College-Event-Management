const { validationResult } = require('express-validator');

/** Returns 422 with a field-error map when express-validator checks fail. */
module.exports = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  const errors = {};
  result.array().forEach((e) => {
    if (!errors[e.path]) errors[e.path] = e.msg;
  });
  res.status(422).json({ message: Object.values(errors)[0], errors });
};
