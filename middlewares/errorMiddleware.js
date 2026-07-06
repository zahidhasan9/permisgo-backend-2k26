// const notFound = (req, res, next) => {
//   res.status(404);
//   next(new Error(`Not Found - ${req.originalUrl}`));
// };

// const errorHandler = (err, req, res, next) => {
//   const statusCode =
//     res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

//   const responseBody = {
//     success: false,
//     message: err.message || "Internal Server Error",
//   };

//   if (process.env.NODE_ENV !== "production") {
//     responseBody.stack = err.stack;
//   }

//   console.error("Error:", {
//     statusCode,
//     message: err.message,
//     path: req.originalUrl,
//     method: req.method,
//   });

//   res.status(statusCode).json(responseBody);
// };

// export { notFound, errorHandler };

const notFound = (req, res, next) => {
  res.status(404);
  next(new Error(`Not Found - ${req.originalUrl}`));
};

const errorHandler = (err, req, res, next) => {
  const statusCode =
    err.statusCode ||
    (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);

  const responseBody = {
    success: false,
    message: err.message || "Internal Server Error",
  };

  if (process.env.NODE_ENV !== "production") {
    responseBody.stack = err.stack;
  }

  console.error("Error:", {
    statusCode,
    message: err.message,
    path: req.originalUrl,
    method: req.method,
  });

  res.status(statusCode).json(responseBody);
};

export { notFound, errorHandler };
