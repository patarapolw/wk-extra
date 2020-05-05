import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const registeredLayouts = [
  'App'
]

registeredLayouts.map((layout) => {
  Vue.component(`${layout}-layout`, () => import(/* webpackChunkName: "[request]-layout" */ `../layouts/${layout}.vue`))
})

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/',
      component: () => import(/* webpackChunkName: "[request]" */ '../views/Home.vue')
    },
    {
      path: '/random',
      component: () => import(/* webpackChunkName: "[request]" */ '../views/Random.vue'),
      meta: {
        layout: 'App'
      }
    }
    // {
    //   path: '/quiz',
    //   component: () => import(/* webpackChunkName: "[request]" */ '../views/Quiz.vue'),
    //   meta: {
    //     layout: 'App'
    //   }
    // },
    // {
    //   path: '/character',
    //   component: () => import(/* webpackChunkName: "[request]" */ '../views/Character.vue'),
    //   meta: {
    //     layout: 'App'
    //   }
    // },
    // {
    //   path: '/vocab',
    //   component: () => import(/* webpackChunkName: "[request]" */ '../views/Vocab.vue'),
    //   meta: {
    //     layout: 'App'
    //   }
    // },
    // {
    //   path: '/extra',
    //   component: () => import(/* webpackChunkName: "[request]" */ '../views/Extra.vue'),
    //   meta: {
    //     layout: 'App'
    //   }
    // },
    // {
    //   path: '/settings',
    //   component: () => import(/* webpackChunkName: "[request]" */ '../views/Settings.vue'),
    //   meta: {
    //     layout: 'App'
    //   }
    // }
  ]
})

export default router
