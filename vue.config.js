const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  // ESLint v9 flat config is incompatible with @vue/cli-plugin-eslint v5's webpack plugin.
  // Linting is handled by `yarn lint` (eslint CLI) and the husky pre-commit hook.
  lintOnSave: false,
  chainWebpack: config => {
    config.plugin('define').tap(options => {
      Object.assign(options[0], {
        __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: JSON.stringify(false)
      })
      return options
    })
  }
})