process.env.VUE_APP_COTTER_API_KEY = process.env.COTTER_API_KEY

module.exports = {
  configureWebpack (config) {
    config.resolve.extensions.unshift('.vue')
  },
  transpileDependencies: [
    'vuetify'
  ]
}
