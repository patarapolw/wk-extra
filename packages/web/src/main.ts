import Vue from 'vue'
import firebase from 'firebase/app'
import dayjs from 'dayjs'

import 'firebase/auth'
import 'firebase/analytics'

import App from './App.vue'
import router from './router'
import store from './store'
import { humanizeDuration } from './util'

import './plugins/buefy'
import './plugins/fontawesome'
import './plugins/context'

firebase.initializeApp(JSON.parse(process.env.VUE_APP_FIREBASE_CONFIG!))
firebase.analytics()

firebase.auth().onAuthStateChanged((user) => {
  store.commit('setUser', user)
})

Vue.filter('format', (v: any) => {
  if (typeof v === 'number') {
    return (v || v === 0) ? v.toLocaleString() : ''
  } else if (v instanceof Date) {
    return dayjs(v).format('YYYY-MM-DD HH:mm')
  } else if (v && typeof v === 'object') {
    return JSON.stringify(v)
  }
  return v
})

Vue.filter('formatDate', (v: any) => {
  return dayjs(v).format('YYYY-MM-DD HH:mm')
})

Vue.filter('duration', (v: any) => {
  return v ? humanizeDuration(+new Date(v) - +new Date()) : ''
})

Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
