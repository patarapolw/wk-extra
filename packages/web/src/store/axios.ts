import { AxiosInstance } from 'axios'
import { SnackbarProgrammatic as Snackbar, LoadingProgrammatic as Loading } from 'buefy'

let loading = null as {
  close(): any
} | null
let requestEnded = false
let requestTimeout = null as number | null

export function listenToApi (api: AxiosInstance) {
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
              if (loading && !requestEnded) {
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
      requestEnded = true
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

    console.error(err)
    Snackbar.open(err.message)
    return err
  })
}
