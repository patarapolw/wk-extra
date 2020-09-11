module.exports = {
  configureWebpack (config) {
    config.resolve.extensions.unshift('.vue')
  },
  transpileDependencies: [
    'vuetify'
  ]
}
