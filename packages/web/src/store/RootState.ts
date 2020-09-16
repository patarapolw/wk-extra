import { getStoreBuilder } from 'vuex-typex'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface RootState {
}

export const storeBuilder = getStoreBuilder<RootState>()
