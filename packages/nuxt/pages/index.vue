<template>
  <section class="IndexPage">
    <div class="columns w-full">
      <div class="column is-10-desktop is-offset-1-desktop">
        <div class="content dark-style">
          <h3>
            Extraneous SRS quizzing and custom items, including Mandarin
            Chinese. For&nbsp;
            <a
              href="http://www.wanikani.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              WaniKani.com
            </a>
            .
          </h3>
        </div>
        <form class="field" @submit.prevent="doLogin">
          <input
            v-model="apiKey"
            type="text"
            class="input"
            placeholder="Please enter your API key"
            aria-label="API-key"
          />
          <button type="submit" class="button control" :disabled="!apiKey">
            <span>
              <fontawesome :icon="['fab', 'google']" />
            </span>
            <span>Login with Google</span>
          </button>
        </form>
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator'

@Component
export default class IndexPage extends Vue {
  apiKey = ''

  get email() {
    const u = this.$store.state.settings.user
    return u ? (u.email as string) : null
  }

  async doLogin() {
    if (!this.email) {
      const provider = new this.$fireAuthObj.GoogleAuthProvider()
      await this.$fireAuth.signInWithPopup(provider)
    }

    await this.$axios.$put('/api/user', {
      email: this.email,
      apiKey: this.apiKey,
    })

    this.$store.commit('wanikani/setApiKey', this.apiKey)
    this.$router.push('/random')
  }
}
</script>

<style scoped>
.IndexPage {
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  background-color: #6d695c;
  background-image: repeating-linear-gradient(
      120deg,
      rgba(255, 255, 255, 0.1),
      rgba(255, 255, 255, 0.1) 1px,
      transparent 1px,
      transparent 60px
    ),
    repeating-linear-gradient(
      60deg,
      rgba(255, 255, 255, 0.1),
      rgba(255, 255, 255, 0.1) 1px,
      transparent 1px,
      transparent 60px
    ),
    linear-gradient(
      60deg,
      rgba(0, 0, 0, 0.1) 25%,
      transparent 25%,
      transparent 75%,
      rgba(0, 0, 0, 0.1) 75%,
      rgba(0, 0, 0, 0.1)
    ),
    linear-gradient(
      120deg,
      rgba(0, 0, 0, 0.1) 25%,
      transparent 25%,
      transparent 75%,
      rgba(0, 0, 0, 0.1) 75%,
      rgba(0, 0, 0, 0.1)
    );
  background-size: 70px 120px;
}

.IndexPage > .columns {
  width: 100%;
}

.dark-style {
  color: white;
}

.dark-style h1,
.dark-style h2,
.dark-style h3,
.dark-style h4,
.dark-style h5,
.dark-style h6,
.dark-style a {
  color: inherit;
}

.dark-style a {
  color: #b3dbff;
}

form > * {
  margin-bottom: 1rem;
}

form button span + span {
  margin-right: 1em;
}
</style>
