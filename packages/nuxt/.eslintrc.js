module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
  },
  extends: [
    '@nuxtjs/eslint-config-typescript',
    'prettier',
    'prettier/vue',
    'plugin:prettier/recommended',
    'plugin:nuxt/recommended',
    'plugin:vue-a11y/base',
  ],
  plugins: ['prettier', 'vue-a11y', 'simple-import-sort'],
  // add your custom rules here
  rules: {
    'vue-a11y/label-has-for': 0,
    'import/named': 0,
    'no-unused-vars': 0,
    '@typescript-eslint/no-unused-vars': 0,
    'vue/no-v-html': 0,
    'require-await': 0,
    'sort-imports': 0,
    'import/order': 0,
    'simple-import-sort/sort': [
      'error',
      {
        groups: [
          // Node.js builtins. You could also generate this regex if you use a `.js` config.
          // For example: `^(${require("module").builtinModules.join("|")})(/|$)`
          [`^(${require('module').builtinModules.join('|')})(/|$)`],
          // Packages. `react` and `vue` related packages come first.
          ['^react', '^@?\\w', '^vue-', '^nuxt-'],
          // Internal packages.
          ['^(@|@company|@ui|components|utils|config|vendored-lib)(/.*|$)'],
          // Side effect imports.
          ['^\\u0000'],
          // Parent imports. Put `..` last.
          ['^\\.\\.(?!/?$)', '^\\.\\./?$'],
          // Other relative imports. Put same-folder imports and `.` last.
          ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],
          // Style imports.
          ['^.+\\.s?css$'],
        ],
      },
    ],
  },
}
