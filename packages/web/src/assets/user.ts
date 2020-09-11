import axios from 'axios'

export const api = {
  axios: axios.create({
    baseURL: '/api'
  }),
  setToken (token: string) {
    this.axios.defaults.headers = this.axios.defaults.headers || {}
    this.axios.defaults.headers.Authorization = `Bearer ${token}`
  },
  unsetToken () {
    delete this.axios.defaults.headers.Authorization
  },
  getToken () {
    if (this.axios.defaults.headers?.Authorization) {
      return this.axios.defaults.headers.Authorization.split(' ')[1]
    }

    return null
  }
}
