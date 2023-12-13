import type { APIGatewayProxyResult } from "aws-lambda";
import type { ValidationError } from "yup";

type FormattedValidationError = {
  path?: string;
  type?: string;
  value?: unknown;
  errors: Array<string>;
  inner: Array<FormattedValidationError>;
};

export function createYupValidationErrorResponse(
  error: ValidationError,
): APIGatewayProxyResult {
  return {
    statusCode: 400,
    body: JSON.stringify({
      message: error.message,
      validationError: formatValidationError(error),
    }),
  };
}

function formatValidationError(
  error: ValidationError,
): FormattedValidationError {
  return {
    path: error.path,
    type: error.type,
    value: error.value,
    errors: error.errors,
    inner: error.inner.map((e) => formatValidationError(e)),
  };
}
