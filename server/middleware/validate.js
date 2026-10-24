// Runs after express-validator rules; returns 422 with field-wise errors if any rule failed
const { validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  // { fieldName: "first error message" } - easy for the frontend to show inline
  const errors = {};
  result.array().forEach((err) => {
    if (!errors[err.path]) errors[err.path] = err.msg;
  });

  return res.status(422).json({ success: false, message: 'Validation failed', errors });
};

module.exports = validate;
