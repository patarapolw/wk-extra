import { MutationTree } from 'vuex'

export const state = () => ({
  isAppReady: false,
})

export type RootState = ReturnType<typeof state>

export const mutations: MutationTree<RootState> = {
  setAppReady(state, isReady: boolean) {
    state.isAppReady = isReady
  },
}
