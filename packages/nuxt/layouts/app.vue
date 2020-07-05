<template>
  <section class="AppLayout">
    <b-loading v-if="!isAppReady" active />

    <nav v-if="isAppReady" class="vertical-nav">
      <div class="icon-nav">
        <component
          :is="nav.to ? 'router-link' : 'a'"
          v-for="nav in navItems"
          :key="nav.name"
          :to="nav.to"
          :class="{ active: $route.path === nav.to }"
          :href="nav.href"
          :rel="nav.href ? 'noopener noreferrer' : undefined"
          :target="nav.href ? '_blank' : undefined"
        >
          <fontawesome v-if="nav.icon" :icon="nav.icon" />
          <span v-if="nav.han" class="icon font-han">{{ nav.han }}</span>
          <span>{{ nav.name }}</span>
        </component>
      </div>

      <div class="flex-grow" />

      <div class="icon-nav">
        <b-tooltip label="Click to logout">
          <a @click="doLogout" @keypress="doLogout">
            <figure class="image is-48x48">
              <img
                class="is-rounded"
                :src="getGravatarUrl(user.email)"
                :alt="user.email"
              />
            </figure>
            <span>{{ user.email }}</span>
          </a>
        </b-tooltip>
      </div>
    </nav>

    <b-navbar v-if="isAppReady" class="main-nav has-shadow is-warning">
      <template slot="brand">
        <b-navbar-item tag="router-link" to="/">
          <strong>WK</strong>
          <span>Extra</span>
        </b-navbar-item>
      </template>
      <template slot="start">
        <b-navbar-item
          v-for="nav in navItems"
          :key="nav.name"
          :tag="nav.to ? 'router-link' : 'a'"
          :to="nav.to"
          :active="$route.path === nav.to"
          :href="nav.href"
          :rel="nav.href ? 'noopener noreferrer' : undefined"
          :target="nav.href ? '_blank' : undefined"
        >
          {{ nav.name }}
        </b-navbar-item>
      </template>
      <template slot="end">
        <b-navbar-item tag="div"> Signed in as {{ user.email }} </b-navbar-item>
        <b-navbar-item tag="div">
          <button
            class="button is-danger"
            @click="doLogout"
            @keypress="doLogout"
          >
            Logout
          </button>
        </b-navbar-item>
      </template>
    </b-navbar>

    <main v-if="isReady">
      <nuxt />
    </main>
  </section>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'nuxt-property-decorator'

import { getGravatarUrl } from '~/assets/gravatar'

@Component
export default class AppLayout extends Vue {
  navItems = [
    {
      name: 'Random',
      to: '/random',
      icon: 'random',
    },
    {
      name: 'Quiz',
      to: '/quiz',
      icon: 'question-circle',
    },
    {
      name: 'Edit',
      to: '/edit',
      icon: 'folder-plus',
    },
    {
      name: 'Character',
      to: '/character',
      han: '字',
    },
    {
      name: 'Settings',
      to: '/settings',
      icon: 'cog',
    },
    {
      name: 'About',
      href: 'https://github.com/patarpaolw/wk-extra',
      icon: ['fab', 'github'],
    },
  ]

  getGravatarUrl = getGravatarUrl

  get isAppReady() {
    return this.$store.state.isAppReady
  }

  get isAuthReady() {
    return this.$store.state.auth.isAuthReady
  }

  get user() {
    return this.$store.state.auth.user
  }

  created() {
    this.onAuthChanged()
  }

  async doLogout() {
    await this.$fireAuth.signOut()
  }

  @Watch('isAuthReady')
  @Watch('user')
  async onAuthChanged() {
    if (this.isAuthReady) {
      if (this.user) {
        this.$store.dispatch('wanikani/doCache')
      } else {
        this.$router.push('/')
      }
    }
  }
}
</script>

<style scoped>
.AppLayout {
  display: flex;
  width: 100vw;
  height: 100vh;
  flex-direction: column;
}

.vertical-nav {
  display: none;
  overflow: visible;
  z-index: 10;
  display: flex;
  flex-direction: column;
  width: 300px;
  min-width: 300px;
  background-image: radial-gradient(
    circle at center right,
    rgb(255, 233, 162),
    rgb(255, 220, 106)
  );
}

.vertical-nav .svg-inline--fa,
.vertical-nav .icon {
  --icon-size: 30px;

  font-size: 20px;
  font-weight: 600;
  width: var(--icon-size);
  height: var(--icon-size);
  margin: 10px;
  align-self: center;
}

.icon-nav {
  display: flex;
  flex-direction: column;
}

.icon-nav:first-child {
  margin-top: 1rem;
}

.icon-nav:last-child {
  margin-bottom: 0.5rem;
}

.icon-nav a {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.icon-nav a:active {
  background-color: rgba(238, 238, 238, 0.295);
}

.icon-nav:last-child figure {
  margin-left: 0.5rem;
  margin-right: 1rem;
}

.main-nav {
  display: flex;
  background-image: radial-gradient(
    circle at center right,
    rgb(255, 233, 162),
    rgb(255, 220, 106)
  );
}

main {
  overflow: scroll;
  flex-grow: 1;
  padding: 1rem;
  background-color: rgb(250, 250, 250);
}

@media screen and (max-width: 1024px) {
  .AppLayout {
    flex-direction: column;
  }

  .vertical-nav {
    display: none;
  }

  .main-nav {
    display: flex;
    flex-direction: column;
  }
}

@media (min-width: 1025px) {
  .AppLayout {
    flex-direction: row;
  }

  .vertical-nav {
    display: flex;
  }

  .main-nav {
    display: none;
  }
}
</style>
