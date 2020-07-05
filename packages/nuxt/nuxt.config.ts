import { Configuration } from '@nuxt/types'

export default (): Configuration => {
  return {
    telemetry: false,
    /*
     ** Nuxt rendering mode
     ** See https://nuxtjs.org/api/configuration-mode
     */
    mode: 'universal',
    /*
     ** Nuxt target
     ** See https://nuxtjs.org/api/configuration-target
     */
    target: 'static',
    /*
     ** Headers of the page
     ** See https://nuxtjs.org/api/configuration-head
     */
    head: {
      title: 'WaniKani Extra',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          hid: 'description',
          name: 'description',
          content: 'SRS extensions beyond WaniKani',
        },
        {
          hid: 'keywords',
          name: 'keywords',
          content: 'wanikani,japanese,srs,quiz',
        },
      ],
      link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
      script: [
        {
          async: true,
          defer: true,
          'data-domain': 'wk-extra.polv.cc',
          src: 'https://plausible.io/js/plausible.js',
        },
      ],
    },
    /*
     ** Global CSS
     */
    css: ['~/assets/app.css'],
    /*
     ** Plugins to load before mounting the App
     ** https://nuxtjs.org/guide/plugins
     */
    plugins: [
      '~/plugins/axios-loading.client.ts',
      '~/plugins/codemirror.client.js',
      '~/plugins/filter.ts',
      '~/plugins/firebase-auth.client.ts',
      '~/plugins/vue-context.client.js',
      '~/plugins/webcomponents.client.ts',
    ],
    /*
     ** Auto import components
     ** See https://nuxtjs.org/api/configuration-components
     */
    components: true,
    /*
     ** Nuxt.js dev-modules
     */
    buildModules: [
      '@nuxt/typescript-build',
      [
        '@nuxtjs/fontawesome',
        {
          component: 'fontawesome',
          icons: {
            solid: [
              'faSearch',
              'faCaretDown',
              'faCaretUp',
              'faTag',
              'faExclamationCircle',
              'faInfoCircle',
              'faExclamationTriangle',
              'faRandom',
              'faAngleLeft',
              'faAngleRight',
              'faAngleUp',
              'faArrowUp',
              'faEyeSlash',
              'faEye',
              'faQuestionCircle',
              'faFolderPlus',
              'faCog',
            ],
            brands: ['faGithub', 'faGoogle'],
          },
        },
      ],
    ],
    /*
     ** Nuxt.js modules
     */
    modules: [
      [
        'nuxt-buefy',
        {
          materialDesignIcons: false,
          defaultIconPack: 'fas',
          defaultIconComponent: 'fontawesome',
        },
      ],
      // Doc: https://axios.nuxtjs.org/usage
      [
        '@nuxtjs/axios',
        {
          proxy: true,
          validateStatus: (status: number) => {
            if (status === 401) {
              return true
            }

            return status >= 200 && status < 300 // default
          },
        },
      ],
      [
        '@nuxtjs/firebase',
        {
          config: JSON.parse(process.env.FIREBASE_CONFIG!),
          services: {
            auth: true,
            storage: true,
          },
        },
      ],
    ],
    proxy: {
      '/api/': 'http://localhost:8080',
    },
    /*
     ** Build configuration
     ** See https://nuxtjs.org/api/configuration-build/
     */
    build: {
      extend: (config) => {
        config.module!.rules.push({
          test: /\.ya?ml$/,
          type: 'json', // Required by Webpack v4
          use: 'yaml-loader',
        })
      },
    },
  }
}