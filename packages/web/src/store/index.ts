import {
  mutationTree,
  useAccessor
} from 'typed-vuex'
import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

const state = () => ({
  apiKey: ''
})

const mutations = mutationTree(state, {
  SET_API_KEY (state, apiKey) {
    state.apiKey = apiKey
  }
})

const storePattern = {
  state,
  mutations
}

const store = new Vuex.Store(storePattern)

export const accessor = useAccessor(store, storePattern)

// Optionally, inject accessor globally
Vue.prototype.$accessor = accessor

export default store
