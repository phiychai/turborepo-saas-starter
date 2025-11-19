import { Bouncer } from '@adonisjs/bouncer';

import type { HttpContext } from '@adonisjs/core/http';
import type { NextFn } from '@adonisjs/core/types/http';

import * as abilities from '#abilities/main';
import { policies } from '#policies/main';

/**
 * Init bouncer middleware is used to create a bouncer instance
 * during an HTTP request
 */
export default class InitializeBouncerMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    /**
     * Create bouncer instance for the ongoing HTTP request.
     * We will pull the user from the HTTP context.
     */
    // Bouncer expects policies as Record<string, LazyImport>, but we have a plain object
    // The runtime behavior works correctly, but TypeScript types are strict

    ctx.bouncer = new Bouncer(
      () => ctx.auth.user || null,
      abilities,
      policies as any
    ).setContainerResolver(ctx.containerResolver);

    /**
     * Share bouncer helpers with Edge templates.
     */
    if (
      'view' in ctx &&
      ctx.view &&
      typeof ctx.view === 'object' &&
      'share' in ctx.view &&
      typeof ctx.view.share === 'function'
    ) {
      ctx.view.share(ctx.bouncer.edgeHelpers);
    }

    return next();
  }
}

declare module '@adonisjs/core/http' {
  export interface HttpContext {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    bouncer: Bouncer<Exclude<HttpContext['auth']['user'], undefined>, typeof abilities, any>;
  }
}
