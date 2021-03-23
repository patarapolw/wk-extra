<template>
  <vue-context ref="contextmenu" lazy>
    <li v-for="(a, i) in additional" :key="i">
      <a role="button" @click.prevent="a.handler" @keypress.prevent="a.handler">
        {{ a.name }}
      </a>
    </li>
    <li v-if="additional.length" class="separator">
      <a></a>
    </li>
    <li v-if="entries.length === 1">
      <a role="button" @click.prevent="doSpeak()" @keypress.prevent="doSpeak()">
        Speak
      </a>
    </li>
    <li v-if="type && quiz.db.length < entries.length">
      <a
        role="button"
        @click.prevent="addToQuiz()"
        @keypress.prevent="addToQuiz()"
      >
        Add to quiz
      </a>
    </li>
    <li v-if="quiz.db.length">
      <a
        role="button"
        @click.prevent="removeFromQuiz()"
        @keypress.prevent="removeFromQuiz()"
      >
        Remove from quiz
      </a>
    </li>
    <li v-if="entries.length === 1" class="separator">
      <a></a>
    </li>
    <li v-if="entries.length === 1">
      <a
        role="button"
        @click="
          openInNewTab(
            `/#/kanji?q=${encodeURIComponent(entries[0])}`,
            entries[0] + ' - Kanji'
          )
        "
      >
        Search as Kanji
      </a>
    </li>
    <li v-if="entries.length === 1 && type !== 'character'">
      <a
        role="button"
        @click="
          openInNewTab(
            `/#/vocabulary?${
              type === 'vocabulary' ? 'entry' : 'q'
            }=${encodeURIComponent(entries[0])}`,
            entries[0] + ' - Vocabulary'
          )
        "
      >
        Search as Vocab
      </a>
    </li>
    <li v-if="entries.length === 1 && type !== 'sentence'">
      <a
        role="button"
        @click="
          openInNewTab(
            `https://en.wiktionary.org/wiki/${encodeURIComponent(entries[0])}`
          )
        "
      >
        Open in wiktionary
      </a>
    </li>
    <li v-if="entries.length === 1">
      <a
        role="button"
        @click="
          openInNewTab(
            `https://jisho.org/searcth/${encodeURIComponent(entries[0])}`
          )
        "
      >
        Open in Jisho.org
      </a>
    </li>
    <li v-if="id">
      <a
        role="button"
        @click.prevent="doDelete()"
        @keypress.prevent="doDelete()"
      >
        Delete
      </a>
    </li>
  </vue-context>
</template>

<script lang="ts">
import { Vue, Component, Prop, Ref } from 'vue-property-decorator'
import { speak } from '@/assets/speak'
import { api } from '@/assets/api'

@Component
export default class ContextMenu extends Vue {
  @Prop() id?: string
  @Prop({ required: true }) entry!: string | string[]
  @Prop({ required: true }) type!: string
  @Prop() source?: string
  @Prop() direction?: string
  @Prop() description?: string
  @Prop({ default: () => ({}) }) reading!: Record<string, string>
  @Prop({ default: () => ({}) }) english!: Record<string, string>

  @Prop({ default: () => [] }) additional!: {
    name: string
    handler: () => void
  }[]

  @Ref() contextmenu!: {
    open: (evt: MouseEvent) => void
  }

  openInNewTab = window.parent
    ? (url: string, title?: string) => {
        window.parent.open(url, title)
      }
    : (url: string) => {
        open(url, '_blank', 'noopener noreferrer')
      }

  quiz: {
    of?: {
      entries: string[]
      type: string
    }
    db: {
      ids: string[]
    }[]
  } = {
    db: [],
  }

  get entries() {
    return Array.isArray(this.entry)
      ? this.entry
      : this.entry
      ? [this.entry]
      : []
  }

  async setQuiz() {
    if (this.entries.length && this.type) {
      const {
        data: { result },
      } = await api.quizGetByEntries(null, {
        entry: this.entries,
        type: this.type,
        direction: this.direction ? [this.direction] : [],
      })

      const entryMap = new Map<string, string[]>()
      result.map(({ id, entry }) => {
        const c = entryMap.get(entry) || []
        c.push(id)
        return entryMap.set(entry, c)
      })

      this.quiz = {
        of: {
          entries: this.entries,
          type: this.type,
        },
        db: Array.from(entryMap.values()).map((ids) => ({ ids })),
      }
    }
  }

  open(evt: MouseEvent) {
    this.$nextTick(async () => {
      if (this.entry && this.type) {
        if (
          !(
            this.quiz.of &&
            this.quiz.of.type !== this.type &&
            this.quiz.of.entries.length === this.entries.length &&
            this.quiz.of.entries.every((el, i) => this.entries[i] === el)
          )
        ) {
          await this.setQuiz()
        }

        this.contextmenu.open(evt)
      }
    })
  }

  async doDelete() {
    if (this.id) {
      await api.entryDelete({
        id: this.id,
      })
    }

    this.$emit('deleted', this.id)
  }

  async doSpeak() {
    if (this.entries.length === 1) {
      await speak(this.entries[0])
    }
  }

  async addToQuiz() {
    if (this.entries.length && this.type) {
      await api.quizCreate(null, {
        entry: this.entries.map((entry) => {
          return {
            entry,
            reading: this.reading[entry] ? [this.reading[entry]] : [],
            english: this.english[entry] ? [this.english[entry]] : [],
          }
        }),
        type: this.type,
        description: this.description,
      })

      await this.setQuiz()

      this.$emit('quiz:added', {
        entries: this.entries,
        type: this.type,
        db: this.quiz.db,
      })
    }
  }

  async removeFromQuiz() {
    if (this.entries.length && this.type) {
      await api.quizDeleteByEntries(null, {
        entry: this.entries,
        type: this.type,
      })

      this.$buefy.snackbar.open(
        `Removed ${this.type}: ${this.entries.slice(0, 3).join(', ')}${
          this.entries.length > 3 ? '...' : ''
        }  from quiz`
      )

      const { db } = this.quiz
      this.quiz = {
        ...this.quiz,
        db: [],
      }

      this.$emit('quiz:removed', {
        entries: this.entries,
        type: this.type,
        db,
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.v-context {
  li.separator {
    display: flex;
    flex-direction: row;
    justify-content: center;
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;

    a {
      background-color: lightgray;
      height: 1px;
      width: calc(100% - 1rem);
      padding: 0;
    }
  }
}
</style>
