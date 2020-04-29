import Vue from 'vue'
import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faUsers, faCog, faUserSlash, faTag, faSearch
} from '@fortawesome/free-solid-svg-icons'
import { faGithub, faGoogle } from '@fortawesome/free-brands-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

library.add(
  faUsers, faCog, faUserSlash, faTag, faSearch,
  faGithub, faGoogle
)

Vue.component('fontawesome', FontAwesomeIcon)
