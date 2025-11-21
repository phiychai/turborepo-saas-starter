import { $fetch } from 'ofetch';
import type { Schema } from '@turborepo-saas-starter/shared-types/schema';
import {
  aggregate,
  createDirectus,
  readItem,
  readItems,
  rest,
  readSingleton,
  createItem,
  // updateItem,
  // staticToken,
  uploadFiles,
  // readMe,
  withToken,
  type QueryFilter,
  // readUser,
} from '@directus/sdk';

const {
  public: { directusUrl },
  // directusServerToken,
} = useRuntimeConfig();

// By default, we use the Public permissions to fetch content (even on the server side). If you want to restrict public access it's recommended to use the staticToken option.
const directusServer = createDirectus<Schema>(directusUrl as string, {
  globals: {
    fetch: $fetch,
  },
}).with(rest());
// .with(staticToken(directusServerToken as string));

export {
  directusServer,
  readItem,
  readItems,
  readSingleton,
  createItem,
  withToken,
  aggregate,
  uploadFiles,
};
export type { QueryFilter };
