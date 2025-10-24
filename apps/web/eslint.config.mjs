@ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  // Nuxt-specific overrides
  rules: {
    // Allow console in development
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',

    // Vue-specific
    'vue/multi-word-component-names': 'off',
    'vue/no-v-html': 'warn'
  }
})
