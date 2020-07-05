import { Plugin } from '@nuxt/types'

const onInit: Plugin = ({ app }) => {
  app.$fireAuth.onAuthStateChanged((user) => {
    if (app.store) {
      app.store.dispatch('auth/updateUser', user)
    }
  })
}

export default onInit
