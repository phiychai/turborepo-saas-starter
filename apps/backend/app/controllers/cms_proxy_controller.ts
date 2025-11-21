import type { HttpContext } from '@adonisjs/core/http';

import directusService from '#services/directus_service';

export default class CmsProxyController {
  /**
   * @get
   * @summary Proxy GET request to CMS
   * @description Proxies GET requests to Directus CMS. Supports query parameters for filtering, sorting, and pagination. Returns the response from Directus.
   * @tag CMS Proxy
   * @paramPath {string} * - Path to Directus collection/item (e.g., "posts", "posts/123")
   * @paramQuery {string} fields - Comma-separated list of fields to return (e.g., "id,title,content")
   * @paramQuery {object} filter - Directus filter object (e.g., {"status": {"_eq": "published"}})
   * @paramQuery {string} sort - Sort field(s) (e.g., "-date_created" for descending)
   * @paramQuery {integer} limit - Maximum number of items to return
   * @paramQuery {integer} offset - Number of items to skip
   * @paramQuery {integer} page - Page number (alternative to offset)
   * @paramQuery {string} search - Search query string
   * @paramQuery {object} deep - Deep query parameters for relations
   * @response 200 - Content retrieved successfully from CMS
   * @response 500 - Server error - Failed to fetch from CMS
   */
  async get({ params, request, response }: HttpContext) {
    try {
      const path = params['*'].join('/');
      const queryString = request.qs();
      const queryParams =
        Object.keys(queryString).length > 0
          ? `?${new URLSearchParams(queryString).toString()}`
          : '';

      const result = await directusService.proxyRequest(`/items/${path}${queryParams}`, 'GET');

      return response.status(result.status).json(result.data);
    } catch (error) {
      return response.internalServerError({
        message: 'Failed to fetch from CMS',
        error: error.message,
      });
    }
  }

  /**
   * @post
   * @summary Proxy POST request to CMS
   * @description Proxies POST requests to create items in Directus CMS. Requires authentication. The request body is forwarded to Directus.
   * @tag CMS Proxy
   * @paramPath {string} * - Path to Directus collection (e.g., "posts")
   * @requestBody {object} body - Data to create in CMS (structure depends on collection, all collection fields are accepted)
   * @paramQuery {string} fields - Comma-separated list of fields to return in response
   * @response 200 - Content created successfully in CMS
   * @response 401 - Unauthorized - Authentication required
   * @response 400 - Bad request - Invalid data or missing required fields
   * @response 500 - Server error - Failed to create content in CMS
   */
  async post({ params, request, response, auth }: HttpContext) {
    try {
      // Only authenticated users can create content
      await auth.check();

      const path = params['*'].join('/');
      const body = request.body();

      const result = await directusService.proxyRequest(`/items/${path}`, 'POST', body);

      return response.status(result.status).json(result.data);
    } catch (error) {
      return response.internalServerError({
        message: 'Failed to create content in CMS',
        error: error.message,
      });
    }
  }

  /**
   * @patch
   * @summary Proxy PATCH request to CMS
   * @description Proxies PATCH requests to update items in Directus CMS. Requires authentication. Supports partial updates.
   * @tag CMS Proxy
   * @paramPath {string} * - Path to Directus collection/item (e.g., "posts/123")
   * @requestBody {object} body - Data to update in CMS (structure depends on collection, only provided fields will be updated)
   * @paramQuery {string} fields - Comma-separated list of fields to return in response
   * @response 200 - Content updated successfully in CMS
   * @response 401 - Unauthorized - Authentication required
   * @response 404 - Item not found
   * @response 500 - Server error - Failed to update content in CMS
   */
  async patch({ params, request, response, auth }: HttpContext) {
    try {
      // Only authenticated users can update content
      await auth.check();

      const path = params['*'].join('/');
      const body = request.body();

      const result = await directusService.proxyRequest(`/items/${path}`, 'PATCH', body);

      return response.status(result.status).json(result.data);
    } catch (error) {
      return response.internalServerError({
        message: 'Failed to update content in CMS',
        error: error.message,
      });
    }
  }

  /**
   * @delete
   * @summary Proxy DELETE request to CMS
   * @description Proxies DELETE requests to remove items from Directus CMS. Requires admin authentication. Only admins can delete content.
   * @tag CMS Proxy
   * @paramPath {string} * - Path to Directus collection/item (e.g., "posts/123")
   * @response 200 - Content deleted successfully from CMS
   * @response 401 - Unauthorized - Authentication required
   * @response 403 - Forbidden - Admin access required
   * @response 500 - Server error - Failed to delete content from CMS
   */
  async delete({ params, response, auth }: HttpContext) {
    try {
      // Only authenticated users can delete content
      await auth.check();
      const user = auth.user!;

      // Only admins can delete content
      if (user.role !== 'admin') {
        return response.forbidden({
          message: 'Only admins can delete content',
        });
      }

      const path = params['*'].join('/');

      const result = await directusService.proxyRequest(`/items/${path}`, 'DELETE');

      return response.status(result.status).json(result.data);
    } catch (error) {
      return response.internalServerError({
        message: 'Failed to delete content from CMS',
        error: error.message,
      });
    }
  }

  /**
   * @getCollection
   * @summary Get collection items
   * @description Retrieves all items from a specific Directus collection. Supports Directus query parameters for filtering, sorting, and pagination.
   * @tag CMS Proxy
   * @paramPath {string} collection - Collection name (e.g., "posts", "categories")
   * @paramQuery {string} fields - Comma-separated list of fields to return (e.g., "id,title,content")
   * @paramQuery {object} filter - Directus filter object (e.g., {"status": {"_eq": "published"}})
   * @paramQuery {string} sort - Sort field(s) (e.g., "-date_created" for descending)
   * @paramQuery {integer} limit - Maximum number of items to return
   * @paramQuery {integer} offset - Number of items to skip
   * @paramQuery {integer} page - Page number (alternative to offset)
   * @paramQuery {string} search - Search query string
   * @paramQuery {object} deep - Deep query parameters for relations
   * @response 200 - Collection items retrieved successfully
   * @response 500 - Server error - Failed to fetch collection from CMS
   */
  async getCollection({ params, request, response }: HttpContext) {
    try {
      const { collection } = params;
      const queryParams = request.qs();

      const items = await directusService.getItems(collection, queryParams);

      return response.ok({
        collection,
        data: items,
      });
    } catch (error) {
      return response.internalServerError({
        message: 'Failed to fetch collection from CMS',
        error: error.message,
      });
    }
  }

  /**
   * @getItem
   * @summary Get single collection item
   * @description Retrieves a single item from a Directus collection by ID. Supports Directus query parameters for field selection and relations.
   * @tag CMS Proxy
   * @paramPath {string} collection - Collection name (e.g., "posts", "categories")
   * @paramPath {string} id - Item ID (UUID or integer)
   * @paramQuery {string} fields - Comma-separated list of fields to return (e.g., "id,title,content,author.*")
   * @paramQuery {object} deep - Deep query parameters for nested relations (e.g., {"author": {"_filter": {"status": {"_eq": "active"}}}})
   * @response 200 - Item retrieved successfully
   * @response 404 - Item not found
   * @response 500 - Server error - Failed to fetch item from CMS
   */
  async getItem({ params, request, response }: HttpContext) {
    try {
      const { collection } = params;
      const { id } = params;
      const queryParams = request.qs();

      const item = await directusService.getItem(collection, id, queryParams);

      return response.ok({
        collection,
        data: item,
      });
    } catch (error) {
      return response.internalServerError({
        message: 'Failed to fetch item from CMS',
        error: error.message,
      });
    }
  }
}
