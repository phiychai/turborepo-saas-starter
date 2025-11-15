import { defineConfig } from '@adonisjs/redis';

import env from '#start/env';

const redisConfig = defineConfig({
  connection: 'main',

  connections: {
    main: {
      host: env.get('REDIS_HOST'),
      port: env.get('REDIS_PORT'),
      password: env.get('REDIS_PASSWORD') || undefined,
      db: 0,
      keyPrefix: '',
    },
  },
});

export default redisConfig;
