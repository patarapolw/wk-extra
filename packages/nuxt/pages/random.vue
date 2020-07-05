<template>
  <section class="RandomPage">
    <div class="columns">
      <div class="column is-6">
        <div class="item-display">
          <div
            class="font-han clickable"
            @contextmenu.prevent="(evt) => openContextmenu(evt, kanji)"
          >
            {{ kanji.item }}
          </div>
          <b-loading :active="!kanji.item" :is-full-page="false" />
        </div>
        <center>Kanji of the day</center>
      </div>

      <div class="column is-6">
        <div class="item-display">
          <div
            class="font-han clickable"
            @contextmenu.prevent="(evt) => openContextmenu(evt, vocab)"
          >
            {{ vocab.item }}
          </div>
          <b-loading :active="!vocab.item" :is-full-page="false" />
        </div>
        <center>Vocab of the day</center>
      </div>
    </div>

    <div class="item-display">
      <b-tooltip :label="sentence.translation">
        <div
          class="font-han clickable text-center row-lower"
          @contextmenu.prevent="(evt) => openContextmenu(evt, sentence)"
        >
          {{ sentence.item }}
        </div>
      </b-tooltip>
      <b-loading :active="!sentence.item" :is-full-page="false" />
    </div>
    <center>Sentence of the day</center>

    <audio ref="audio" class="hidden">
      <source :src="selected.audio" />
      <track kind="captions" :label="selected.item" />
    </audio>

    <client-only>
      <vue-context ref="contextmenu" lazy>
        <li>
          <a
            role="button"
            @click.prevent="reload(selected.type)"
            @keypress.prevent="reload(selected.type)"
          >
            Reload
          </a>
        </li>
        <li>
          <a
            role="button"
            @click.prevent="speak(selected.item, 'ja')"
            @keypress.prevent="speak(selected.item, 'ja')"
          >
            Speak
          </a>
        </li>
        <li v-if="chineseMode && isChineseVocab(selected)">
          <a
            role="button"
            @click.prevent="speak(selected.item, 'zh')"
            @keypress.prevent="speak(selected.item, 'zh')"
          >
            Speak in Chinese
          </a>
        </li>
        <li v-if="!selected.quizIds.length">
          <a
            role="button"
            @click.prevent="addToQuiz(selected)"
            @keypress.prevent="addToQuiz(selected)"
          >
            Add to quiz
          </a>
        </li>
        <li v-else>
          <a
            role="button"
            @click.prevent="removeFromQuiz(selected)"
            @keypress.prevent="removeFromQuiz(selected)"
          >
            Remove from quiz
          </a>
        </li>
        <li>
          <router-link
            :to="{ path: '/character', query: { q: selected.item } }"
            target="_blank"
          >
            Search for character
          </router-link>
        </li>
        <li>
          <a
            :href="`https://jisho.org/search/${selected.item}`"
            target="_blank"
            rel="noopener noreferrer"
          >
            Open in Jisho
          </a>
        </li>
        <li v-if="chineseMode">
          <a
            :href="mdbgUrl(selected)"
            target="_blank"
            rel="noopener noreferrer"
          >
            Open in MDBG
          </a>
        </li>
      </vue-context>
    </client-only>
  </section>
</template>

<script lang="ts">
import XRegExp from 'xregexp'
import { Component, Vue } from 'nuxt-property-decorator'

import { speak } from '~/assets/speak'

interface IItem {
  item: string
  type: string
  translation?: string
}

type ISelected = IItem & {
  quizIds: string[]
  audio: string
}

@Component({
  layout: 'app',
})
export default class RandomPage extends Vue {
  selected: ISelected = {
    item: '',
    quizIds: [],
    type: '',
    audio: '',
  }

  kanji: IItem = {
    item: '',
    type: 'kanji',
  }

  vocab: IItem = {
    item: '',
    type: 'vocab',
  }

  sentence: IItem = {
    item: '',
    type: 'sentence',
    translation: '',
  }

  get chineseMode() {
    return this.$store.state.settings.chineseMode
  }

  created() {
    this.reload('kanji')
    this.reload('vocab')
    this.reload('sentence')
  }

  mdbgUrl(item: IItem) {
    let kw = item.item

    if (item.type !== 'sentence') {
      kw = `*${kw}*`
    }

    return `https://www.mdbg.net/chinese/dictionary?page=worddict&wdrst=0&wdqb=${kw}`
  }

  isChineseVocab(item: IItem) {
    return item.type === 'vocab' && XRegExp('\\p{Han}+').test(item.item)
  }

  async speak(item: string, lang: string) {
    if (lang === 'ja' && this.selected.audio) {
      await (this.$refs.audio as HTMLAudioElement).play()
    } else {
      await speak(item, lang)
    }
  }

  async openContextmenu(evt: MouseEvent, item: IItem) {
    const { quizIds, audio } = await this.$axios.$post('/api/item', {
      item: item.item,
      type: item.type,
      settings: this.$store.state.settings,
    })

    this.selected.item = item.item
    this.selected.type = item.type
    this.selected.quizIds = quizIds
    this.selected.audio = audio
    ;(this.$refs.contextmenu as any).open(evt)
  }

  async reload(type: string) {
    const { item, translation } = await this.$axios.$post('/api/item/random', {
      wanikaniIds: this.$store.state.wanikani.items.map((it: any) => it.id),
      type,
    })

    const it: IItem = (this as any)[type]
    it.item = item
    it.translation = translation

    this.$set(this, type, it)
  }

  async addToQuiz({ item, type }: ISelected) {
    await this.$axios.$put('/api/item/quiz', {
      item,
      type,
      settings: this.$store.state.settings,
    })
    this.$buefy.snackbar.open(`Added ${type}: ${item} to quiz`)
  }

  async removeFromQuiz({ item, type, quizIds }: ISelected) {
    await this.$axios.$delete('/api/item/quiz', {
      data: {
        item,
        type,
        quizIds,
      },
    })
    this.$buefy.snackbar.open(`Removed ${type}: ${item} from quiz`)
  }
}
</script>

<style scoped>
.RandomPage > .columns {
  width: 100%;
  margin-top: 1rem;
}

.item-display .font-han {
  font-size: 50px;
  min-height: 60px;
}

.item-display .font-han.row-lower {
  font-size: 30px;
  min-width: 3em;
  min-height: 40px;
}
</style>
