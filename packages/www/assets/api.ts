import {
  LoadingProgrammatic as Loading,
  SnackbarProgrammatic as Snackbar,
} from 'buefy'
import OpenAPIClientAxios from 'openapi-client-axios'

import { Client } from '../types/openapi'

export const wanikaniApiKey = {
  _key: 'WANIKANI_API_KEY',
  _value: '',
  get() {
    if (!this._value) {
      this._value = localStorage.getItem(this._key) || ''
      if (this._value) {
        this.set(this._value)
      }
    }

    return this._value
  },
  set(v: string) {
    localStorage.setItem(this._key, v)
    this._value = v

    api.defaults.headers.Authorization = `Bearer ${this._value}`
  },
}

export const apiClient = new OpenAPIClientAxios({
  definition: require('./openapi.json'),
  axiosConfigDefaults: {
    headers: {
      Authorization: (() => {
        const apiKey = wanikaniApiKey.get()
        return apiKey ? `Bearer ${apiKey}` : undefined
      })(),
    },
  },
})

// eslint-disable-next-line import/no-mutable-exports
export let api: Client

let loading: {
  close(): void
  requestEnded?: boolean
} | null = null
let requestTimeout: number | null = null

export async function initAPI() {
  if (api) {
    return api
  }

  api = await apiClient.init<Client>()

  api.interceptors.request.use((config) => {
    if (!loading) {
      if (requestTimeout) {
        clearTimeout(requestTimeout)
        requestTimeout = null
      }

      requestTimeout = window.setTimeout(() => {
        if (!loading) {
          loading = Loading.open({
            isFullPage: true,
            canCancel: true,
            onCancel: () => {
              if (loading && !loading.requestEnded) {
                Snackbar.open('API request is loading in background.')
              }
            },
          })
        }
      }, 5000)
    }

    return config
  })

  api.interceptors.response.use(
    (config) => {
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
    },
    (err) => {
      if (loading) {
        loading.close()
        loading = null
      }

      if (requestTimeout) {
        clearTimeout(requestTimeout)
        requestTimeout = null
      }

      // eslint-disable-next-line no-console
      console.error(err)
      Snackbar.open(err.message)

      return err
    }
  )

  return api
}
