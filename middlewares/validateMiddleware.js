import ApiError from "../utils/ApiError.js";

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return next(
      new ApiError(400, error.details.map((d) => d.message).join(", ")),
    );
  }

  req.body = value;
  next();
};

export default validate;
