/**
 * Proxy all Better Auth requests to the backend
 * This allows same-origin cookies to work in development
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const backendUrl = config.public.apiUrl || 'http://localhost:3333';

  // Get the path after /api/auth
  const path = event.path.replace('/api/auth', '');
  const targetUrl = `${backendUrl}/api/auth${path}`;

  // Get query parameters
  const query = getQuery(event);
  const queryString = new URLSearchParams(query as any).toString();
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
      // Add timeout and better error handling
      signal: AbortSignal.timeout(10000), // 10 second timeout
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

    // Read and return the response body as text
    // Let the Better Auth client parse the JSON to avoid Nitro serialization issues
    const responseText = await response.text();
    setHeader(event, 'content-type', 'application/json');

    return responseText;
  } catch (error: any) {
    console.error('❌ Auth proxy error:', error);
    console.error(`   Backend URL: ${backendUrl}`);
    console.error(`   Target URL: ${fullUrl}`);

    // Provide more helpful error messages
    let errorMessage = 'Authentication service unavailable';
    let statusCode = 503; // Service Unavailable

    if (error.name === 'AbortError' || error.message?.includes('timeout')) {
      errorMessage =
        'Authentication service timeout. Please check if the backend server is running.';
    } else if (error.message?.includes('ECONNREFUSED') || error.message?.includes('connect')) {
      errorMessage = `Cannot connect to backend server at ${backendUrl}. Please ensure the backend is running on port 3333.`;
      statusCode = 503;
    } else if (error.message?.includes('ENOTFOUND')) {
      errorMessage = `Backend server not found at ${backendUrl}. Please check your configuration.`;
      statusCode = 503;
    } else {
      errorMessage = error.message || 'Authentication proxy error';
    }

    throw createError({
      statusCode,
      statusMessage: errorMessage,
      data: {
        message: errorMessage,
        backendUrl,
        originalError: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
    });
  }
});
