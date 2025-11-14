import type { HttpContext } from '@adonisjs/core/http';

/**
 * Convert AdonisJS Request to Web Standard Request
 * Better Auth expects standard Web API Request objects
 */
export async function toWebRequest(request: HttpContext['request']): Promise<Request> {
  const url = new URL(request.url(), `http://${request.header('host')}`);

  // Prepare request body for non-GET/HEAD requests
  let body: string | undefined;
  if (!['GET', 'HEAD'].includes(request.method())) {
    const rawBody = request.body();
    body = typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody);
  }

  return new Request(url, {
    method: request.method(),
    headers: request.headers() as HeadersInit,
    body,
  });
}

/**
 * Convert Web Standard Response to AdonisJS Response
 * Properly handles headers (especially Set-Cookie) and status codes
 */
export async function fromWebResponse(
  webResponse: Response,
  adonisResponse: HttpContext['response']
) {
  // Set status code
  adonisResponse.status(webResponse.status);

  // Forward all headers
  webResponse.headers.forEach((value, key) => {
    adonisResponse.header(key, value);
  });

  // Read and return response body
  const responseBody = await webResponse.text();
  return adonisResponse.send(responseBody);
}
