import { wkMaxLevel } from '@/assets/wanikani'

import { storeBuilder } from './RootState'

export class UserState {
  username = ''
  maxLevelShown = wkMaxLevel
  level = wkMaxLevel
}

const b = storeBuilder.module<UserState>('user', new UserState())

export const mutations = {
  SET_USER: b.commit(function setUser (state, { username, maxLevelShown, level }: {
    username: string;
    maxLevelShown: number;
    level: number;
  }) {
    state.username = username
    state.maxLevelShown = maxLevelShown
    state.level = level
  }),
  UNSET_USER: b.commit(function unsetUser (state) {
    state.username = ''
    state.maxLevelShown = wkMaxLevel
    state.level = wkMaxLevel
  })
}
