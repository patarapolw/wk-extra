import { ActionTree, Module, MutationTree } from 'vuex'
import { User } from 'firebase/app'
import axios from 'axios'
import { listenToApi } from './axios'

const state = {
  user: null as User | null,
  allowChinese: false,
  cutOffSrsLevel: [0, 9]
}

const mutations: MutationTree<typeof state> = {
  setUser (state, user) {
    state.user = user
  }
}

const actions: ActionTree<typeof state, any> = {
  async getApi ({ state }, silent: boolean = false) {
    const api = axios.create()

    if (state.user) {
      api.defaults.headers.Authorization = `Bearer ${await state.user.getIdToken()}`
    }

    if (!silent) {
      listenToApi(api)
    }

    return api
  }
}

const module: Module<typeof state, any> = {
  namespaced: true,
  state,
  mutations,
  actions
}

export default module
