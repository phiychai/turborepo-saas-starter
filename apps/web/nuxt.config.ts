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
    '@nuxt/content', // Must be before @nuxtjs/seo for proper integration
    '@vueuse/nuxt',
    'nuxt-og-image',
    'nuxt-security',
    '@nuxtjs/seo', // Includes sitemap functionality, no need for separate @nuxtjs/sitemap
    '@nuxt/scripts',
    '@nuxtjs/mdc',
  ],

  devtools: {
    enabled: true,
  },

  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL as string,
      apiUrl: process.env.NUXT_PUBLIC_API_URL as string,
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

  // Sitemap configuration (provided by @nuxtjs/seo)
  sitemap: {
    sources: ['/api/sitemap'],
    // Disable automatic Nuxt Content integration to avoid import errors
    exclude: [],
    autoI18n: false,
  },

  // Nuxt Content configuration
  content: {
    // Prevent sitemap auto-detection issues
    experimental: {
      search: false,
    },
  },

  security: {
    headers: {
      contentSecurityPolicy: {
        'img-src': ["'self'", 'data:', '*'],
        'script-src': ["'self'", "'unsafe-inline'", '*'],
        'connect-src': ["'self'", 'http://localhost:3333', 'http://localhost:8055'],
        'frame-ancestors': ["'self'", 'http://localhost:8055'],
      },
    },
  },
});
