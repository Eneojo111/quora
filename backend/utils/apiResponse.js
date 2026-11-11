
export const sendSuccess = (
  res,
  {
    statusCode = 200,
    message = "Request successful",
    data = null,
    pagination = null
  } = {}
) => {
  const response = {
    success: true,
    message,
    data
  };

  if (pagination) {
    response.pagination = pagination;
  }

  return res.status(statusCode).json(response);
};

export const sendError = (
  res,
  {
    statusCode = 500,
    message = "Internal server error",
    errors = null
  } = {}
) => {
  const response = {
    success: false,
    message
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};
