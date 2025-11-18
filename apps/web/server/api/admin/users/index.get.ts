/**
 * Proxy GET /api/admin/users requests to the backend
 * This handles the root path for listing users
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const backendUrl = config.public.apiUrl || 'http://localhost:3333';

  const targetUrl = `${backendUrl}/api/admin/users`;

  // Get query parameters
  const query = getQuery(event);
  const queryString = new URLSearchParams(query as Record<string, string | string[]>).toString();
  const fullUrl = queryString ? `${targetUrl}?${queryString}` : targetUrl;

  // Forward the request to backend using native fetch
  try {
    const headers: Record<string, string> = {};
    const incomingHeaders = getHeaders(event);

    // Forward all headers except host
    for (const [key, value] of Object.entries(incomingHeaders)) {
      if (key.toLowerCase() !== 'host') {
        headers[key] = value;
      }
    }

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers,
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
