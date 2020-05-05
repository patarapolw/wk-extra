<template lang="pug">
section.layout
  b-navbar
    template(slot="brand")
      b-navbar-item(tag="router-link" to="/")
        strong WK
        span Extra
    template(slot="start")
      b-navbar-item(tag="router-link" to="/random") Random
      b-navbar-item(tag="router-link" to="/quiz") Quiz
      b-navbar-item(tag="router-link" to="/character") Character
      b-navbar-item(tag="router-link" to="/vocab") Vocab
      b-navbar-item(tag="router-link" to="/extra") Extra
      b-navbar-item(tag="router-link" to="/settings") Settings
    template(slot="end")
      b-navbar-item(tag="div" v-if="user") Signed in as {{user.email}}
      b-navbar-item(tag="div")
        b-button(v-if="user" type="is-danger" @click="doLogout") Logout
        b-button(v-else type="is-primary" @click="isLoginModal = true") Login
  slot
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import firebase from 'firebase/app'

import 'firebase/auth'

@Component
export default class AppLayout extends Vue {
  get user () {
    return this.$store.state.user
  }

  doLogout () {
    firebase.auth().signOut()
  }
}
</script>
