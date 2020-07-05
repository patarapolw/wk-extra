import { MutationTree } from 'vuex'

export const state = () => ({
  kaniwani: true,
  chineseMode: false,
})

export type State = ReturnType<typeof state>

export const mutations: MutationTree<State> = {
  updateSettings(state, settings) {
    Object.assign(state, settings)
  },
}
