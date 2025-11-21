// for AdonisJS v6
import path from 'node:path';
import url from 'node:url';
// ---

export default {
  // path: __dirname + "/../", for AdonisJS v5
  path: `${path.dirname(url.fileURLToPath(import.meta.url))}/../`, // for AdonisJS v6
  title: 'Turborepo SaaS Starter API', // use info instead
  version: '1.0.0', // use info instead
  description: 'RESTful API for the Turborepo SaaS Starter application', // use info instead
  tagIndex: 2,
  productionEnv: 'production', // optional
  info: {
    title: 'Turborepo SaaS Starter API',
    version: '1.0.0',
    description:
      'A comprehensive RESTful API for managing users, authentication, content, billing, and administrative tasks. Built with AdonisJS and Better Auth.',
  },
  snakeCase: true,

  debug: true, // set to true, to get some useful debug output
  ignore: ['/swagger', '/docs'],
  preferredPutPatch: 'PATCH', // if PUT/PATCH are provided for the same route, prefer PATCH
  common: {
    parameters: {
      page: {
        name: 'page',
        in: 'query',
        description: 'Page number for pagination',
        schema: {
          type: 'integer',
          default: 1,
          minimum: 1,
        },
      },
      limit: {
        name: 'limit',
        in: 'query',
        description: 'Number of items per page',
        schema: {
          type: 'integer',
          default: 25,
          minimum: 1,
          maximum: 100,
        },
      },
    },
    headers: {
      Authorization: {
        name: 'Authorization',
        in: 'header',
        description: 'Bearer token for authentication',
        schema: {
          type: 'string',
          format: 'Bearer {token}',
        },
        required: true,
      },
    },
  },
  securitySchemes: {
    BearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'Enter your Bearer token in the format: Bearer {token}',
    },
  },
  authMiddlewares: ['auth', 'auth:api'], // optional
  defaultSecurityScheme: 'BearerAuth', // optional
  persistAuthorization: true, // persist authorization between reloads on the swagger page
  showFullPath: false, // the path displayed after endpoint summary
};
