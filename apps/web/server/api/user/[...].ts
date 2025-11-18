/**
 * Proxy all user API requests to the backend
 * This allows same-origin cookies to work in development
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const backendUrl = config.public.apiUrl || 'http://localhost:3333';

  // Get the path after /api/user
  const path = event.path.replace('/api/user', '');
  const targetUrl = `${backendUrl}/api/user${path}`;

  // Get query parameters
  const query = getQuery(event);
  const queryString = new URLSearchParams(query as Record<string, string | string[]>).toString();
  const fullUrl = queryString ? `${targetUrl}?${queryString}` : targetUrl;

  // Get request body for POST/PUT/PATCH
  let body;
  if (['POST', 'PUT', 'PATCH'].includes(event.method)) {
    body = await readBody(event);
  }

  // Forward the request to backend using native fetch
  try {
    const headers: Record<string, string> = {};
    const incomingHeaders = getHeaders(event);

    // Copy relevant headers, exclude host
    for (const [key, value] of Object.entries(incomingHeaders)) {
      if (key.toLowerCase() !== 'host') {
        headers[key] = value;
      }
    }

    const response = await fetch(fullUrl, {
      method: event.method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    // Forward response headers (especially Set-Cookie)
    const responseHeaders = response.headers;

    // Handle Set-Cookie specially - native fetch supports getSetCookie()
    const cookies = responseHeaders.getSetCookie?.() || [];
    if (cookies.length > 0) {
      cookies.forEach((cookie) => {
        appendResponseHeader(event, 'set-cookie', cookie);
      });
    }

    // Forward other headers
    responseHeaders.forEach((value, key) => {
      if (key.toLowerCase() !== 'set-cookie') {
        setHeader(event, key, value);
      }
    });

    // Set status code
    setResponseStatus(event, response.status);

    // Read and return the response body
    const responseText = await response.text();
    setHeader(event, 'content-type', 'application/json');

    return responseText;
  } catch (error: unknown) {
    console.error('❌ User API proxy error:', error);
    const status = error && typeof error === 'object' && 'status' in error ? (error as { status?: number }).status : undefined;
    const message = error instanceof Error ? error.message : String(error);
    throw createError({
      statusCode: status || 500,
      statusMessage: 'User API proxy error',
      data: message,
    });
  }
});
