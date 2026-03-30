const pluginVue = require('eslint-plugin-vue')
const babelParser = require('@babel/eslint-parser')
const globals = require('globals')

module.exports = [
  ...pluginVue.configs['flat/essential'],
  {
    files: ['**/*.{js,vue}'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
      },
      parserOptions: {
        parser: babelParser,
        requireConfigFile: false,
      },
    },
    rules: {
      'vue/multi-word-component-names': 'off',
    },
  },
]
