// This file is generated, do not edit!
// node create-errors.js

import { StatusError } from "./error";

export function multipleChoicesError(
  message = "Multiple Choices",
): StatusError {
  return new StatusError(300, message);
}

export function movedPermanentlyError(
  message = "Moved Permanently",
): StatusError {
  return new StatusError(301, message);
}

export function foundError(message = "Found"): StatusError {
  return new StatusError(302, message);
}

export function seeOtherError(message = "See Other"): StatusError {
  return new StatusError(303, message);
}

export function notModifiedError(message = "Not Modified"): StatusError {
  return new StatusError(304, message);
}

export function useProxyError(message = "Use Proxy"): StatusError {
  return new StatusError(305, message);
}

export function temporaryRedirectError(
  message = "Temporary Redirect",
): StatusError {
  return new StatusError(307, message);
}

export function badRequestError(message = "Bad Request"): StatusError {
  return new StatusError(400, message);
}

export function unauthorizedError(message = "Unauthorized"): StatusError {
  return new StatusError(401, message);
}

export function paymentRequiredError(
  message = "Payment Required",
): StatusError {
  return new StatusError(402, message);
}

export function forbiddenError(message = "Forbidden"): StatusError {
  return new StatusError(403, message);
}

export function notFoundError(message = "Not Found"): StatusError {
  return new StatusError(404, message);
}

export function methodNotAllowedError(
  message = "Method Not Allowed",
): StatusError {
  return new StatusError(405, message);
}

export function notAcceptableError(message = "Not Acceptable"): StatusError {
  return new StatusError(406, message);
}

export function proxyAuthenticationRequiredError(
  message = "Proxy Authentication Required",
): StatusError {
  return new StatusError(407, message);
}

export function requestTimeoutError(message = "Request Timeout"): StatusError {
  return new StatusError(408, message);
}

export function conflictError(message = "Conflict"): StatusError {
  return new StatusError(409, message);
}

export function goneError(message = "Gone"): StatusError {
  return new StatusError(410, message);
}

export function lengthRequiredError(message = "Length Required"): StatusError {
  return new StatusError(411, message);
}

export function preconditionFailedError(
  message = "Precondition Failed",
): StatusError {
  return new StatusError(412, message);
}

export function requestEntityTooLargeError(
  message = "Request Entity Too Large",
): StatusError {
  return new StatusError(413, message);
}

export function requestURITooLongError(
  message = "Request-URI Too Long",
): StatusError {
  return new StatusError(414, message);
}

export function unsupportedMediaTypeError(
  message = "Unsupported Media Type",
): StatusError {
  return new StatusError(415, message);
}

export function requestedRangeNotSatisfiableError(
  message = "Requested Range Not Satisfiable",
): StatusError {
  return new StatusError(416, message);
}

export function expectationFailedError(
  message = "Expectation Failed",
): StatusError {
  return new StatusError(417, message);
}

export function internalServerError(
  message = "Internal Server Error",
): StatusError {
  return new StatusError(500, message);
}

export function notImplementedError(message = "Not Implemented"): StatusError {
  return new StatusError(501, message);
}

export function badGatewayError(message = "Bad Gateway"): StatusError {
  return new StatusError(502, message);
}

export function serviceUnavailableError(
  message = "Service Unavailable",
): StatusError {
  return new StatusError(503, message);
}

export function gatewayTimeoutError(message = "Gateway Timeout"): StatusError {
  return new StatusError(504, message);
}

export function httpVersionNotSupportedError(
  message = "HTTP Version Not Supported",
): StatusError {
  return new StatusError(505, message);
}
