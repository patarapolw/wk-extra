import { api } from '@/assets/user'
import { wk } from '@/assets/wanikani'
import { accessor } from '@/store'
import Cotter from 'cotter'
import { Component, Vue } from 'vue-property-decorator'

@Component<App>({
  created () {
    if (api.getToken()) {
      this.loading = false
    }
  },
  mounted () {
    console.log(accessor.user)

    if (this.loading) {
      this.loading = false
      const cotter = new Cotter({
        ApiKeyID: process.env.VUE_APP_COTTER_API_KEY,
        Type: 'email',
        ContainerID: 'cotter-form-container',
        AdditionalFields: [
          {
            label: 'WaniKani API token',
            name: 'apiKey',
            placeholder: 'Active WaniKani subscription is required. Leave blank if you are a previous user.'
          }
        ],
        OnBegin: async (payload) => {
          const { client_json: { apiKey } } = payload as unknown as {
            client_json: {
              apiKey: string;
            };
          }

          if (!wk.validateApiKey(apiKey)) {
            return 'Invalid API key'
          }

          try {
            await wk.getUser(apiKey)
            return null
          } catch (e) {
            const { error, code } = e.response.data
            return `${error} (${code})`
          }
        },
        OnSuccess: async (result) => {
          const r = result as unknown as {
            apiKey: string;
            email: string;
          }

          wk.setApiKey(r.apiKey)
          const user = await wk.getUser(r.apiKey)

          accessor.user.SET_USER({
            apiKey: r.apiKey,
            level: user.data.level
          })
        }
      })

      const user = cotter.getLoggedInUser()

      if (!user) {
        this.$nextTick(async () => {
          if (!user) {
            await cotter
              .signInWithLink()
              .showEmailForm()
          }
        })
      } else {
        cotter.logOut().then(() => {
          return cotter
            .signInWithLink()
            .showEmailForm()
        })
      }
    }
  }
})
export default class App extends Vue {
  loading = true
  loginKey = ''
}
