import Vue from 'vue'
import Vuex from 'vuex'

import SettingsStore from './settings'
import WaniKaniStore from './wanikani'

Vue.use(Vuex)

const store = new Vuex.Store({
  modules: {
    settings: SettingsStore,
    wanikani: WaniKaniStore
  }
})

export default store
