import type { HttpContext } from '@adonisjs/core/http';

import directusService from '#services/directus_service';

export default class CmsProxyController {
  /**
   * Proxy GET requests to Directus
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
   * Proxy POST requests to Directus
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
   * Proxy PATCH requests to Directus
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
   * Proxy DELETE requests to Directus
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
   * Get all items from a collection
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
   * Get a single item from a collection
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
