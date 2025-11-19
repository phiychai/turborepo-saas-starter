/**
 * Proxy all admin API requests to the backend
 * This allows same-origin cookies to work in development
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const backendUrl = config.public.apiUrl || 'http://localhost:3333';

  // Get the path after /api/admin/users
  // For catch-all routes, getRouterParam returns the matched path segments
  const routerParam = getRouterParam(event, '_');
  // If routerParam exists, it's a subpath (e.g., "123" for /api/admin/users/123)
  // If it's empty/undefined, it's the root path (/api/admin/users)
  const path = routerParam ? `/${routerParam}` : '';
  const targetUrl = `${backendUrl}/api/admin/users${path}`;

  // Get query parameters
  const query = getQuery(event);

  // Convert query params to URLSearchParams format, handling arrays
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) {
      if (Array.isArray(value)) {
        // For arrays, append each value
        value.forEach((v) => params.append(key, String(v)));
      } else {
        params.append(key, String(value));
      }
    }
  }
  const queryString = params.toString();
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

    // Forward all headers except host
    for (const [key, value] of Object.entries(incomingHeaders)) {
      if (key.toLowerCase() !== 'host' && value !== undefined) {
        headers[key] = value;
      }
    }

    const response = await fetch(fullUrl, {
      method: event.method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include',
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw createError({
          statusCode: 401,
          statusMessage: 'Not authenticated',
        });
      }
      if (response.status === 403) {
        throw createError({
          statusCode: 403,
          statusMessage: 'Access denied. Admin access required.',
        });
      }
      const errorData = await response.json().catch(() => ({}));
      throw createError({
        statusCode: response.status,
        statusMessage: errorData.message || 'Request failed',
        data: errorData,
      });
    }

    const data = await response.json();
    return data;
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to proxy admin request',
      data: error instanceof Error ? error.message : String(error),
    });
  }
});
