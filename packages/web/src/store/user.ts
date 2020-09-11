import { wkMaxLevel } from '@/assets/wanikani'
import { mutationTree } from 'typed-vuex'

const state = () => ({
  username: '',
  level: wkMaxLevel
})

const mutations = mutationTree(state, {
  SET_USER (state, { username, level }: {
    username: string;
    level: number;
  }) {
    state.username = username
    state.level = level
  },
  UNSET_USER (state) {
    state.username = ''
    state.level = wkMaxLevel
  }
})

export default {
  namespaced: true,
  state,
  mutations
}
