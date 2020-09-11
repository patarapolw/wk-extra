import { accessor } from '@/store'
import Vue from 'vue'

declare module 'vue/types/vue' {
  interface Vue {
    $accessor: typeof accessor;
  }
}

declare module '*.vue' {
  export default Vue
}
