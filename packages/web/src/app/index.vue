<template>
  <v-app>
    <v-container
      v-if="loading"
      fill-height
    >
      <v-layout
        column
        justify-center
        align-center
      >
        <v-progress-circular
          indeterminate
          :size="70"
        />
      </v-layout>
    </v-container>

    <v-dialog
      v-else-if="!$store.state.apiKey"
      :value="true"
      max-width="500"
      persistent
    >
      <v-card class="pa-4">
        <div id="cotter-form-container" style="height: 300px;"></div>
      </v-card>
    </v-dialog>

    <fragment v-else>
      <v-app-bar
        app
        color="primary"
        dark
      >
        <div class="d-flex align-center">
          <v-img
            alt="Vuetify Logo"
            class="shrink mr-2"
            contain
            src="https://cdn.vuetifyjs.com/images/logos/vuetify-logo-dark.png"
            transition="scale-transition"
            width="40"
          />

          <v-img
            alt="Vuetify Name"
            class="shrink mt-1 hidden-sm-and-down"
            contain
            min-width="100"
            src="https://cdn.vuetifyjs.com/images/logos/vuetify-name-dark.png"
            width="100"
          />
        </div>

        <v-spacer></v-spacer>

        <v-btn
          href="https://github.com/vuetifyjs/vuetify/releases/latest"
          target="_blank"
          text
        >
          <span class="mr-2">Latest Release</span>
          <v-icon>mdi-open-in-new</v-icon>
        </v-btn>
      </v-app-bar>

      <v-main>
        <router-view />
      </v-main>
    </fragment>
  </v-app>
</template>
<script lang="ts" src="./index.ts" />
