<template lang="pug">
#App
  component(v-if="layout" :is="layout")
    router-view
  router-view(v-else)
</template>

<script lang="ts">
import { Vue, Component, Watch } from 'vue-property-decorator'

@Component
export default class App extends Vue {
  get user () {
    return this.$store.state.user
  }

  get layout () {
    const layout = this.$route.meta.layout
    return layout ? `${layout}-layout` : null
  }

  @Watch('user')
  onUserChange () {
    if (!this.user) {
      this.$router.push('/')
    }
  }
}
</script>
