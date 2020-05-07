<template lang="pug">
section#Home
  .columns(style="width: 100%;")
    .column.is-10-desktop.is-offset-1-desktop
      .content.dark-style
        h3
          | Extraneous SRS quizzing and custom items, including Mandarin Chinese.
          | For&nbsp;
          a(href="https://wanikani.com" target="_blank" rel="noopener") WaniKani.com
          | .
      b-input(placeholder="Please enter your API key" v-model="apiKey" style="margin-bottom: 1em;")
      b-button(style="width: 100%;" :disabled="!apiKey" @click="doLogin()")
        fontawesome(:icon="['fab', 'google']" style="margin-right: 1em;")
        span Login with Google
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import firebase from 'firebase/app'

import 'firebase/auth'
import 'firebase/firestore'

@Component
export default class Home extends Vue {
  apiKey = ''

  get email () {
    const u = this.$store.state.settings.user
    return u ? u.email as string : null
  }

  doLogin () {
    const provider = new firebase.auth.GoogleAuthProvider()
    firebase.auth().signInWithPopup(provider)
  }
}
</script>

<style lang="scss">
#Home {
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  background-color: #6d695c;
  background-image:
    repeating-linear-gradient(120deg, rgba(255,255,255,.1), rgba(255,255,255,.1) 1px, transparent 1px, transparent 60px),
    repeating-linear-gradient(60deg, rgba(255,255,255,.1), rgba(255,255,255,.1) 1px, transparent 1px, transparent 60px),
    linear-gradient(60deg, rgba(0,0,0,.1) 25%, transparent 25%, transparent 75%, rgba(0,0,0,.1) 75%, rgba(0,0,0,.1)),
    linear-gradient(120deg, rgba(0,0,0,.1) 25%, transparent 25%, transparent 75%, rgba(0,0,0,.1) 75%, rgba(0,0,0,.1));
  background-size: 70px 120px;

  .dark-style {
    color: white;

    h1, h2, h3, h4, h5, h6, a {
      color: inherit;
    }

    a {
      color: rgb(179, 219, 255);
    }
  }
}
</style>
