/// <reference types="vuetify/types" />

import './registerServiceWorker'

import Vue from 'vue'
import Fragment from 'vue-fragment'

import App from './app'
import vuetify from './plugins/vuetify'
import router from './router'
import store from './store'

Vue.config.productionTip = false

Vue.use(Fragment.Plugin)

new Vue({
  router,
  store,
  vuetify,
  render: h => h(App)
}).$mount('#app')
