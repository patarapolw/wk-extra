<template lang="pug">
article#Random
  .columns(style="width: 100%; margin-top: 1em;")
    .column.is-6
      .item-display
        .font-han.clickable(style="font-size: 50px; min-height: 60px;"
          @contextmenu.prevent="(evt) => $refs.kanjiContextmenu.open(evt)"
        ) {{kanji.item}}
        b-loading(:active="!kanji.item" :is-full-page="false")
      center Kanji of the day
    .column.is-6
      .item-display
        .font-han.clickable(style="font-size: 50px; min-height: 60px;"
          @contextmenu.prevent="(evt) => $refs.vocabContextmenu.open(evt)"
        ) {{vocab.item}}
        b-loading(:active="!vocab.item" :is-full-page="false")
      center Vocab of the day
  .item-display
    .font-han.clickable.text-center(style="font-size: 30px; min-width: 3em; min-height: 40px"
      @contextmenu.prevent="(evt) => $refs.sentenceContextmenu.open(evt)"
    ) {{sentence.item}}
    b-loading(:active="!sentence.item" :is-full-page="false")
  center Sentence of the day
  vue-context(ref="kanjiContextmenu" lazy)
    li
      a(role="button" @click.prevent="loadKanji()") Reload
    li
      a(role="button" @click.prevent="speak(kanji.item, 'ja')") Speak
    li(v-if="!kanji.id.length")
      a(role="button" @click.prevent="addToQuiz(kanji)") Add to quiz
    li(v-else)
      a(role="button" @click.prevent="removeFromQuiz(kanji)") Remove from quiz
    li
      router-link(:to="{ path: '/vocab', query: { q: kanji.item } }" target="_blank") Search for vocab
    li
      router-link(:to="{ path: '/character', query: { q: kanji.item } }" target="_blank") Search for character
    li
      a(:href="`https://jisho.org/search/${kanji.item}`"
        target="_blank" rel="noopener") Open in Jisho
    li
      a(:href="`https://www.mdbg.net/chinese/dictionary?page=worddict&wdrst=0&wdqb=*${kanji.item}*`"
        target="_blank" rel="noopener") Open in MDBG
  vue-context(ref="vocabContextmenu" lazy)
    li
      a(role="button" @click.prevent="loadVocab()") Reload
    li
      a(role="button" @click.prevent="speak(vocab.item, 'ja')") Speak
    li(v-if="!vocab.id.length")
      a(role="button" @click.prevent="addToQuiz(vocab)") Add to quiz
    li(v-else)
      a(role="button" @click.prevent="removeFromQuiz(vocab)") Remove from quiz
    li
      router-link(:to="{ path: '/vocab', query: { q: vocab.item } }" target="_blank") Search for vocab
    li
      router-link(:to="{ path: '/character', query: { q: vocab.item } }" target="_blank") Search for character
    li
      a(:href="`https://jisho.org/search/${vocab.item}`"
        target="_blank" rel="noopener") Open in Jisho
    li
      a(:href="`https://www.mdbg.net/chinese/dictionary?page=worddict&wdrst=0&wdqb=*${vocab.item}*`"
        target="_blank" rel="noopener") Open in MDBG
  vue-context(ref="sentenceContextmenu" lazy)
    li
      a(role="button" @click.prevent="loadSentence()") Reload
    li
      a(role="button" @click.prevent="speak(sentence.item, 'ja')") Speak
    li(v-if="!sentence.id.length")
      a(role="button" @click.prevent="addToQuiz(sentence)") Add to quiz
    li(v-else)
      a(role="button" @click.prevent="removeFromQuiz(sentence)") Remove from quiz
    li
      router-link(:to="{ path: '/vocab', query: { q: sentence.item } }" target="_blank") Search for vocab
    li
      router-link(:to="{ path: '/character', query: { q: sentence.item } }" target="_blank") Search for character
    li
      a(:href="`https://jisho.org/search/${sentence.item}`"
        target="_blank" rel="noopener") Open in Jisho
    li
      a(:href="`https://www.mdbg.net/chinese/dictionary?page=worddict&wdrst=0&wdqb=${sentence.item}`"
        target="_blank" rel="noopener") Open in MDBG
</template>

<script lang="ts">
import { Vue, Component, Watch } from 'vue-property-decorator'
import { speak } from '@/assets/util'
import { AxiosInstance } from 'axios'

@Component
export default class Random extends Vue {
  kanji = {
    type: 'kanji',
    item: null,
    id: []
  }

  vocab = {
    type: 'vocab',
    item: null,
    id: []
  }

  sentence = {
    type: 'sentence',
    item: null,
    id: []
  }

  speak = speak

  get ids () {
    return (this.$store.state.wanikani.items || []).map((it: any) => it.id)
  }

  async created () {
    this.loadKanji()
    this.loadVocab()
    this.loadSentence()
  }

  @Watch('ids')
  async loadKanji () {
    console.log(this.ids)
    const api = await this.$store.dispatch('settings/getApi') as AxiosInstance
    this.$set(this.kanji, 'item', (await api.post('/api/character/random', { ids: this.ids })).data.entry)
    await this.getQuizStatus(this.kanji)
  }

  @Watch('ids')
  async loadVocab () {
    const api = await this.$store.dispatch('settings/getApi') as AxiosInstance
    this.$set(this.vocab, 'item', (await api.post('/api/vocab/random', { ids: this.ids })).data.entry)
    await this.getQuizStatus(this.vocab)
  }

  @Watch('ids')
  async loadSentence () {
    const api = await this.$store.dispatch('settings/getApi') as AxiosInstance
    this.$set(this.sentence, 'item', (await api.post('/api/sentence/random', { ids: this.ids })).data.ja)
    await this.getQuizStatus(this.sentence)
  }

  async getQuizStatus (_: any) {
    // const vm = this as any

    // if (this.$store.state.user) {
    //   const api = await this.getApi()
    //   const r = await api.post('/api/card/q', {
    //     cond: {
    //       item: item.item,
    //       type: item.type
    //     },
    //     projection: { _id: 1 },
    //     hasCount: false
    //   })

    //   this.$set(vm[item.type], 'id', r.data.result.map((el: any) => el._id))
    // } else {
    //   this.$set(vm[item.type], 'id', [])
    // }
  }

  async addToQuiz (_: any) {
    // if (this.$store.state.user) {
    //   const api = await this.getApi()
    //   await api.put('/api/card/', item)
    //   this.getQuizStatus(item)

    //   this.$buefy.snackbar.open(`Added ${item.type}: ${item.item} to quiz`)
    // }
  }

  async removeFromQuiz (_: any) {
    // if (this.$store.state.user) {
    //   const vm = this as any

    //   const api = await this.getApi()
    //   await Promise.all(vm[item.type].id.map((i: string) => api.delete('/api/card/', {
    //     data: { id: i }
    //   })))
    //   this.getQuizStatus(item)

    //   this.$buefy.snackbar.open(`Removed ${item.type}: ${item.item} from quiz`)
    // }
  }
}
</script>

<style lang="scss">
#Random {
  display: flex;
  flex-direction: column;
  align-items: center;

  .item-display {
    min-height: 60px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    padding: 1em;
    position: relative;
  }
}
</style>
