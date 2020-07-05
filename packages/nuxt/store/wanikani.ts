/* eslint-disable camelcase */
import axios, { AxiosInstance } from 'axios'
import { ActionTree, GetterTree, MutationTree } from 'vuex'

import { RootState } from '.'

export interface IWkResource<T = any> {
  id: number
  integer: string
  url: string
  data_updated_at: string // Date
  data: T
}

export interface IWkCollection<T = any> {
  object: string
  url: string
  pages: {
    next_url?: string
    previous_url?: string
    per_page: number
  }
  total_count: number
  data_updated_at: string // Date
  data: T[]
}

export interface IWkError {
  error: string
  code: number
}

export const state = () => ({
  apiKey: '',
  items: [] as {
    id: number
    srsLevel: number
  }[],
})

export type State = ReturnType<typeof state>

export const mutations: MutationTree<State> = {
  setItems(state, items) {
    state.items = items
  },
  setApiKey(state, apiKey) {
    state.apiKey = apiKey || state.apiKey
  },
  unsetApiKey(state) {
    state.apiKey = ''
  },
}

export const getters: GetterTree<State, RootState> = {
  api({ apiKey }) {
    return axios.create({
      baseURL: 'https://api.wanikani.com/v2/',
      headers: {
        Authorization: apiKey ? `Bearer ${apiKey}` : undefined,
      },
    })
  },
}

export const actions: ActionTree<State, RootState> = {
  async doCache({ commit, getters }) {
    const wkApi = getters.api as AxiosInstance
    let nextUrl = '/assignments'
    const allData: {
      id: number
      srsLevel: number
    }[] = []

    while (true) {
      const r = await wkApi.get<
        IWkCollection<
          IWkResource<{
            subject_id: number
            srs_stage: number
          }>
        >
      >(nextUrl, {
        params: {
          unlocked: 'true',
        },
      })

      r.data.data.map((d) => {
        allData.push({
          id: d.data.subject_id,
          srsLevel: d.data.srs_stage,
        })
      })

      nextUrl = r.data.pages.next_url || ''
      if (!nextUrl) {
        break
      }
    }

    commit('wanikani/setItems', allData)
    commit('setAppReady', true)
  },
}
