import { Component, Vue } from 'vue-property-decorator'

@Component<App>({
  created () {
    setTimeout(() => {
      this.loading = false
    }, 2000)
  }
})
export default class App extends Vue {
  loading = true
  loginKey = ''

  readonly rules: Record<string, (s: string) => string> = {
    apiKey: (s) => {
      const hex = '[0-9a-f]'
      return new RegExp(`^${hex}{8}-${hex}{4}-${hex}{4}-${hex}{4}-${hex}{12}$`).test(s)
        ? ''
        : 'Invalid API key'
    },
    email: (s) => {
      /**
       * @see https://stackoverflow.com/questions/46155/how-to-validate-an-email-address-in-javascript
       */
      const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      return re.test(String(s).toLowerCase())
        ? ''
        : 'Invalid email address'
    }
  }

  doLogin () {
    if (this.loginKey) {
      const e = this.getLoginKeyError()
      if (e) {
        alert(e)
      } else {
        this.$accessor.SET_API_KEY(this.loginKey)
      }
    }
  }

  getLoginKeyError () {
    const s = this.loginKey

    const emailError = this.rules.email(s)
    if (!emailError) return ''

    const apiError = this.rules.apiKey(s)
    if (!apiError) return ''

    return apiError || emailError
  }
}
