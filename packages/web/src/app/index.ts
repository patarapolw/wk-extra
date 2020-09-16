import { api } from '@/assets/user'
import { wk } from '@/assets/wanikani'
import * as userStore from '@/store/user'
import Cotter from 'cotter'
import { Component, Vue } from 'vue-property-decorator'

type ThenArg<T> = T extends PromiseLike<infer U> ? U : T

@Component<App>({
  created () {
    if (api.getToken()) {
      this.loading = false
    }
  },
  async mounted () {
    if (this.loading) {
      this.loading = false
      let user: ThenArg<ReturnType<typeof wk.getUser>> | null = null

      const cotter = new Cotter({
        ApiKeyID: process.env.VUE_APP_COTTER_API_KEY,
        Type: 'email',
        ContainerID: 'cotter-form-container',
        AdditionalFields: [
          {
            label: 'WaniKani API token',
            name: 'apiKey',
            placeholder: 'Leave blank if you are a previous user'
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
            user = await wk.getUser(apiKey)
            return null
          } catch (e) {
            const { error, code } = e.response.data
            return `${error} (${code})`
          }
        },
        OnSuccess: async (result) => {
          const { apiKey } = result as unknown as {
            apiKey: string;
          }

          api.setToken(result.oauth_token.access_token)
          await api.axios.put('/user', { apiKey })

          wk.setApiKey(apiKey)
          user = user || (await wk.getUser(apiKey))

          userStore.mutations.SET_USER({
            username: user.data.username,
            maxLevelShown: user.data.subscription.max_level_granted,
            level: user.data.level
          })
        }
      })

      const token = cotter.tokenHandler.accessToken

      if (token) {
        api.setToken(token)

        try {
          const { data: { apiKey } } = await api.axios.get<{
            apiKey: string;
          }>('/user')

          wk.setApiKey(apiKey)
          user = user || (await wk.getUser(apiKey))

          userStore.mutations.SET_USER({
            username: user.data.username,
            maxLevelShown: user.data.subscription.max_level_granted,
            level: user.data.level
          })
        } catch (_) {}
      }

      if (!user) {
        this.$nextTick(() => {
          cotter.logOut().then(() => {
            return cotter
              .signInWithLink()
              .showEmailForm()
          })
        })
      }
    }
  }
})
export default class App extends Vue {
  loading = true
  loginKey = ''
}
