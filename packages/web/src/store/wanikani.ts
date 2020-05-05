import Vue from 'vue'
import Vuex from 'vuex'
import axios, { AxiosInstance } from 'axios'
import { SnackbarProgrammatic as Snackbar, LoadingProgrammatic as Loading } from 'buefy'

Vue.use(Vuex)

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

let loading: {
  close(): any
  requestEnded?: boolean
} | null = null
let requestTimeout: number | null = null

const store = new Vuex.Store({
  state: {
    apiKey: '',
    items: null as {
      id: number
      srsLevel: number
    }[] | null
  },
  mutations: {
    setApiKey (state, apiKey) {
      state.apiKey = apiKey
    },
    setCache (state, items) {
      Vue.set(state, 'items', items)
    }
  },
  getters: {
    wkApi (state, silent = false) {
      const api = axios.create({
        baseURL: 'https://api.wanikani.com/v2/',
        headers: {
          Authorization: `Bearer ${state.apiKey}`
        }
      })

      if (!silent) {
        api.interceptors.request.use((config) => {
          if (!loading) {
            if (requestTimeout) {
              clearTimeout(requestTimeout)
              requestTimeout = null
            }

            requestTimeout = setTimeout(() => {
              if (!loading) {
                loading = Loading.open({
                  isFullPage: true,
                  canCancel: true,
                  onCancel: () => {
                    if (loading && !loading.requestEnded) {
                      Snackbar.open('API request is loading in background.')
                    }
                  }
                })
              }
            }, 1000)
          }

          return config
        })

        api.interceptors.response.use((config) => {
          if (loading) {
            loading.requestEnded = true
            loading.close()
            loading = null
          }

          if (requestTimeout) {
            clearTimeout(requestTimeout)
            requestTimeout = null
          }

          return config
        }, (err) => {
          if (loading) {
            loading.close()
            loading = null
          }

          if (requestTimeout) {
            clearTimeout(requestTimeout)
            requestTimeout = null
          }

          console.error(JSON.stringify(err))

          Snackbar.open(err.message)
          return err
        })
      }

      return api
    }
  },
  actions: {
    async doCache ({ state, commit, getters }) {
      if (!state.items) {
        const wkApi = getters('wkApi') as AxiosInstance
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

        commit('setCache', allData)
      }
    }
  }
})

export default store
