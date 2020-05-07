<template lang="pug">
section.layout
  b-navbar(shadow)
    template(slot="brand")
      b-navbar-item(tag="router-link" to="/")
        strong WK
        span extra
    template(slot="start")
      b-navbar-item(tag="router-link" to="/random") Random
      b-navbar-item(tag="router-link" to="/quiz") Quiz
      b-navbar-item(tag="router-link" to="/character") Character
      b-navbar-dropdown(label="Vocab" hoverable)
        b-navbar-item(tag="router-link" to="/jadict") Japanese
        b-navbar-item(tag="router-link" to="/zhdict") Chinese
      b-navbar-item(tag="router-link" to="/library") Library
      b-navbar-item(tag="router-link" to="/extra") Extra
      b-navbar-item(tag="router-link" to="/settings") Settings
    template(slot="end" v-if="user")
      b-navbar-item(tag="div") Signed in as {{user.email}}
      b-navbar-item(tag="div")
        b-button(v-if="user" type="is-danger" @click="doLogout") Logout
  slot
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import firebase from 'firebase/app'

import 'firebase/auth'

@Component
export default class AppLayout extends Vue {
  get user () {
    return this.$store.state.settings.user
  }

  doLogout () {
    firebase.auth().signOut()
  }
}
</script>
