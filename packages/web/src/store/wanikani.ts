import { MutationTree, ActionTree, Module } from 'vuex'
import axios, { AxiosInstance } from 'axios'
import { listenToApi } from './axios'

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

const state = {
  items: null as {
    id: number
    srsLevel: number
  }[] | null
}

const mutations: MutationTree<typeof state> = {
  setItems (state, items) {
    state.items = items
  }
}

const actions: ActionTree<typeof state, any> = {
  async getApi ({ rootState }, silent = false) {
    const api = axios.create({
      baseURL: 'https://api.wanikani.com/v2/',
      headers: {
        Authorization: `Bearer ${localStorage.getItem(`wk-apiKey-${rootState.settings.user.email}`) || ''}`
      }
    })

    if (!silent) {
      listenToApi(api)
    }

    return api
  },
  async doCache ({ state, commit, dispatch }) {
    if (!state.items) {
      const wkApi = await dispatch('getApi') as AxiosInstance
      let nextUrl = '/assignments'
      const allData: {
        id: number
        srsLevel: number
      }[] = []

      while (true) {
        const r = await wkApi.get<IWkCollection<IWkResource<{
          subject_id: number
          srs_stage: number
        }>>>(nextUrl, {
          params: {
            unlocked: 'true'
          }
        })

        r.data.data.map((d) => {
          allData.push({
            id: d.data.subject_id,
            srsLevel: d.data.srs_stage
          })
        })

        nextUrl = r.data.pages.next_url || ''
        if (!nextUrl) {
          break
        }
      }

      commit('setItems', allData)
    }
  }
}

const module: Module<typeof state, any> = {
  namespaced: true,
  state,
  mutations,
  actions
}

export default module
