<template>
  <section class="section">Pending...</section>
</template>

<script>
import { wanikaniApiKey } from '~/assets/api'
export default {
  name: 'LoginPage',
  middleware: ({ redirect }) => {
    if (wanikaniApiKey.get()) {
      redirect('/app')
    }
  },
}
</script>
