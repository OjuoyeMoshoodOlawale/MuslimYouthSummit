/**
 * MYS Platform — Standardised API Response Utilities
 */

export const success = (res, data = null, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const created = (res, data = null, message = 'Resource created successfully') => {
  return success(res, data, message, 201);
};

export const paginated = (res, data, pagination, message = 'Success') => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination,
  });
};

export const error = (res, message = 'An error occurred', statusCode = 400, errors = null) => {
  const payload = { success: false, message };
  if (errors) payload.errors = errors;
  return res.status(statusCode).json(payload);
};

export const notFound = (res, resource = 'Resource') => {
  return error(res, `${resource} not found`, 404);
};

export const unauthorized = (res, message = 'Unauthorised. Please log in.') => {
  return error(res, message, 401);
};

export const forbidden = (res, message = 'You do not have permission to perform this action.') => {
  return error(res, message, 403);
};

export const serverError = (res, message = 'Internal server error. Please try again later.') => {
  return error(res, message, 500);
};

export const validationError = (res, errors, message = 'Validation failed. Please check your inputs.') => {
  return res.status(422).json({ success: false, message, errors });
};

/**
 * Build pagination object for paginated queries
 */
export const buildPagination = (total, page, limit) => ({
  total: parseInt(total),
  page: parseInt(page),
  limit: parseInt(limit),
  totalPages: Math.ceil(total / limit),
  hasNext: page * limit < total,
  hasPrev: page > 1,
});
