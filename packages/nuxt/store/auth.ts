import { User } from 'firebase/app'
import { ActionTree, MutationTree } from 'vuex'

import { RootState } from '.'

export const state = () => ({
  user: null as User | null,
  isAuthReady: false,
  chineseMode: false,
})

export type State = ReturnType<typeof state>

export const mutations: MutationTree<State> = {
  updateUser(state, user) {
    state.user = JSON.parse(JSON.stringify(user))
    state.isAuthReady = true
  },
  updateSettings(state, settings) {
    Object.assign(state, settings)
  },
}

export const actions: ActionTree<State, RootState> = {
  async updateUser({ commit }, user: User | null) {
    if (user) {
      this.$axios.defaults.headers.authorization = `Bearer ${await user.getIdToken()}`
    } else {
      delete this.$axios.defaults.headers.authorization
    }

    const { chineseMode, apiKey } = await this.$axios.$get('/api/user')

    commit('wanikani/setApiKey', apiKey)
    commit('settings/updateSettings', { chineseMode })
    commit('updateUser', user)
  },
}
