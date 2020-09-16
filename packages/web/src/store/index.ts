import './user'

import Vue from 'vue'
import Vuex from 'vuex'

import { storeBuilder } from './RootState'

Vue.use(Vuex)

export default storeBuilder.vuexStore()
