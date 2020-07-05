import { User } from 'firebase/app'
import { ActionTree, MutationTree } from 'vuex'

import { RootState } from '.'

export const state = () => ({
  user: null as User | null,
  isAuthReady: false,
})

export type State = ReturnType<typeof state>

export const mutations: MutationTree<State> = {
  updateUser(state, user) {
    state.user = JSON.parse(JSON.stringify(user))
    state.isAuthReady = true
  },
}

export const actions: ActionTree<State, RootState> = {
  async updateUser({ commit }, user: User | null) {
    commit('setAppReady', false)

    if (user) {
      this.$axios.defaults.headers.authorization = `Bearer ${await user.getIdToken()}`
      const { apiKey, settings } = await this.$axios.$get('/api/user')

      commit('wanikani/setApiKey', apiKey)
      commit('settings/updateSettings', settings)

      commit('auth/updateUser', user)

      /**
       * Must doCache first
       */
      // await dispatch('wanikani/doCache')
      // commit('setAppReady', true)
    } else {
      delete this.$axios.defaults.headers.authorization

      commit('wanikani/unsetApiKey')

      commit('auth/updateUser', user)
      commit('setAppReady', true)
    }
  },
}
