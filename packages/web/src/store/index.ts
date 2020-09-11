import {
  useAccessor
} from 'typed-vuex'
import Vue from 'vue'
import Vuex, { StoreOptions } from 'vuex'

import user from './user'

Vue.use(Vuex)

const state = () => ({})

const storePattern: StoreOptions<ReturnType<typeof state>> = {
  state,
  modules: {
    user
  }
}

const store = new Vuex.Store(storePattern)

export const accessor = useAccessor(store, storePattern)

// Optionally, inject accessor globally
// Vue.prototype.$accessor = accessor

export default store
