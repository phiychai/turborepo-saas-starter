// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  components: [
    { path: '~/components', pathPrefix: false },
    { path: '~/components/block', pathPrefix: false },
    { path: '~/components/shared', pathPrefix: false },
    { path: '~/components/base', pathPrefix: false },
    { path: '~/components/forms', pathPrefix: false },
  ],

  modules: [
    '@nuxt/eslint',
    '@nuxt/image',
    '@nuxt/ui-pro',
    '@nuxtjs/sitemap', // Add this line
    // '@nuxt/content',
    '@vueuse/nuxt',
    'nuxt-og-image',
    'nuxt-security',
    '@nuxtjs/seo',

    '@nuxt/scripts',
    '@vueuse/nuxt',
  ],

  devtools: {
    enabled: true,
  },

  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL as string,
      directusUrl: process.env.DIRECTUS_URL as string,
      enableVisualEditing: process.env.NUXT_PUBLIC_ENABLE_VISUAL_EDITING !== 'false',
    },
    directusServerToken: process.env.DIRECTUS_SERVER_TOKEN,
  },

  routeRules: {
    '/docs': { redirect: '/docs/getting-started', prerender: false },
  },

  compatibilityDate: '2024-07-11',

  nitro: {
    prerender: {
      routes: ['/'],
      crawlLinks: true,
    },
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs',
      },
    },
  },
  vue: {
    propsDestructure: true,
  },

  // typescript: {
  //   typeCheck: true,
  // },
  // Image Configuration - https://image.nuxt.com/providers/directus
  image: {
    providers: {
      directus: {
        provider: 'directus',
        options: {
          baseURL: `${process.env.DIRECTUS_URL}/assets/`,
        },
      },
      local: {
        provider: 'ipx',
      },
    },
  },

  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL as string,
  },
  sitemap: {
    sources: ['/api/sitemap'],
  },

  security: {
    headers: {
      contentSecurityPolicy: {
        'img-src': ["'self'", 'data:', '*'],
        'script-src': ["'self'", "'unsafe-inline'", '*'],
        'connect-src': ["'self'", process.env.DIRECTUS_URL || ''],
        'frame-ancestors': ["'self'", process.env.DIRECTUS_URL || ''],
      },
    },
  },
});
