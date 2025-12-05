// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  components: [
    { path: '~/components', pathPrefix: false },
    { path: '~/components/block', pathPrefix: false },
    { path: '~/components/shared', pathPrefix: false },
    { path: '~/components/base', pathPrefix: false },
    { path: '~/components/forms', pathPrefix: false },
    { path: '~/components/customers' }, // pathPrefix defaults to true, so components get "Customers" prefix
  ],

  modules: [
    '@nuxt/eslint',
    '@nuxt/image',
    '@nuxt/ui',
    '@nuxt/content',
    '@vueuse/nuxt',
    '@pinia/nuxt',
    'pinia-plugin-persistedstate/nuxt',
    ['nuxt-og-image', { enabled: process.env.NODE_ENV !== 'test' }], // Disable in test environment
    'nuxt-security',
    '@nuxt/scripts',
    '@nuxtjs/mdc',
    '@nuxtjs/seo',
  ],

  devtools: {
    enabled: true,
  },
  ssr: true,
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      apiUrl: process.env.NUXT_PUBLIC_API_URL || 'http://localhost:3333',
      directusUrl: process.env.DIRECTUS_URL || 'http://localhost:8055',
      enableVisualEditing: process.env.NUXT_PUBLIC_ENABLE_VISUAL_EDITING !== 'false',
    },
    directusServerToken: process.env.DIRECTUS_SERVER_TOKEN || '',
  },

  routeRules: {
    '/docs': { redirect: '/docs/getting-started', prerender: false },
    '/explore': { prerender: false }, // Exclude from prerender - depends on API data
    '/api/pages/**': { cors: true, headers: { 'Cache-Control': 's-maxage=300' } },
    '/api/posts/**': { cors: true, headers: { 'Cache-Control': 's-maxage=60' } },
    '/api/posts/categories': { cors: true, headers: { 'Cache-Control': 's-maxage=600' } },
  },

  compatibilityDate: '2024-07-11',

  nitro: {
    prerender: {
      routes: ['/'],
      crawlLinks: false, // Disable link crawling to avoid prerender failures for dynamic pages
      failOnError: false, // Don't fail build on prerender errors
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
    // experimental: {
    //   search: false,
    // },
  },

  security: {
    enabled: process.env.NODE_ENV === 'production',
    headers: {
      contentSecurityPolicy:
        process.env.NODE_ENV === 'production'
          ? {
              'img-src': ["'self'", 'data:', '*'],
              'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
              'script-src-attr': ["'unsafe-inline'"],
              'style-src': ["'self'", "'unsafe-inline'"],
              'connect-src': [
                "'self'",
                'http://localhost:8055',
                'http://localhost:3333',
                process.env.DIRECTUS_URL || '',
                process.env.NUXT_PUBLIC_API_URL || '',
              ],
              'frame-ancestors': ["'self'", 'http://localhost:8055'],
            }
          : false, // Disable CSP in development
    },
  },
});
