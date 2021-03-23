<template>
  <section>
    <div class="ExtraPage container">
      <form class="field is-grouped" @submit.prevent="q = q0">
        <b-field class="is-expanded" label="Search" label-position="on-border">
          <input
            v-model="q0"
            class="input"
            type="search"
            name="q"
            placeholder="Type here to search"
            aria-label="search"
          />
        </b-field>

        <button
          class="control button is-success"
          type="button"
          @click="onNewItem"
        >
          Add new item
        </button>
      </form>

      <b-table
        :data="tableData"
        :columns="tableHeader"
        paginated
        backend-pagination
        :total="count"
        :per-page="perPage"
        :current-page.sync="page"
        backend-sorting
        :default-sort="[sort.key, sort.type]"
        @contextmenu="onTableContextmenu"
        @sort="onSort"
      >
      </b-table>
    </div>

    <b-modal v-model="isEditModal">
      <div class="card">
        <header class="card-header">
          <div v-if="!selected.id" class="card-header-title">New item</div>
          <div v-else class="card-header-title">Edit item</div>
        </header>
        <div class="card-content">
          <b-field label="Chinese">
            <b-input
              v-model="selected.chinese"
              placeholder="Must not be empty"
            ></b-input>
          </b-field>
          <b-field label="Pinyin">
            <b-input
              v-model="selected.pinyin"
              placeholder="Must not be empty"
            ></b-input>
          </b-field>
          <b-field label="English">
            <b-input
              v-model="selected.english"
              type="textarea"
              placeholder="Must not be empty"
            ></b-input>
          </b-field>
          <b-field label="Type">
            <b-select v-model="selected.type">
              <option value="vocab">Vocab</option>
              <option value="sentence">Sentence</option>
              <option v-if="selected.chinese.length === 1" value="hanzi">
                Hanzi
              </option>
            </b-select>
          </b-field>
          <b-field label="Description">
            <b-input v-model="selected.description" type="textarea"></b-input>
          </b-field>
          <b-field label="Tag">
            <b-input v-model="selected.tag"></b-input>
          </b-field>
        </div>
        <footer class="card-footer">
          <div class="card-footer-item">
            <button
              class="button is-success"
              type="button"
              @click="selected.id ? doUpdate() : doCreate()"
            >
              Save
            </button>
            <button
              class="button is-cancel"
              type="button"
              @click="isEditModal = false"
            >
              Cancel
            </button>
          </div>
        </footer>
      </div>
    </b-modal>

    <ContextMenu
      :id="selected.id"
      ref="context"
      :entry="selected.chinese"
      :type="selected.type || 'vocab'"
      :description="selected.description"
      source="extra"
      :additional="additionalContext"
      @deleted="doDelete"
    />
  </section>
</template>

<script lang="ts">
import { Component, Ref, Vue, Watch } from 'nuxt-property-decorator'
import ContextMenu from '@/components/ContextMenu.vue'
import { api } from '~/assets/api'
import type { Paths } from '~/types/openapi'

type IExtra = Paths.EntryQuery.Responses.$200['result'][0]

@Component
export default class BrowseTab extends Vue {
  @Ref() context!: ContextMenu

  q0 = ''
  count = 0
  perPage = 10
  page = 1
  tableData: IExtra[] = []
  readonly tableHeader = [
    { field: 'entry', label: 'Entry', sortable: true },
    { field: 'alt', label: 'Alternate forms' },
    { field: 'reading', label: 'Reading' },
    { field: 'english', label: 'English', sortable: true, width: '40vw' },
  ]

  isEditModal = false

  sort = {
    key: 'updatedAt',
    type: 'desc',
  }

  selected: IExtra = {
    id: '',
    entry: '',
    alt: [],
    reading: [],
    english: [],
    type: 'vocabulary',
    description: '',
    tag: [],
  }

  additionalContext = [
    {
      name: 'Edit item',
      handler: () => {
        this.openEditModal()
      },
    },
    {
      name: 'Delete item',
      handler: () => {
        this.doDelete()
      },
    },
  ]

  get q() {
    const q = this.$route.query.q
    return (Array.isArray(q) ? q[0] : q) || ''
  }

  set q(q: string) {
    this.$router.push({ query: { q } })
  }

  async openEditModal() {
    if (!this.selected.reading.length && this.selected.entry) {
      this.selected.reading = [
        {
          kana: await api
            .utilReading({ q: this.selected.entry })
            .then((r) => r.data.result),
        },
      ]
    }

    this.isEditModal = true
  }

  @Watch('page')
  @Watch('perPage')
  @Watch('q')
  async load() {
    const {
      data: { result, count },
    } = await api.entryQuery({
      q: this.q,
      page: this.page,
      limit: this.perPage,
      select: 'entry,alt,reading,english,type,description,tag',
    })

    this.tableData = result
    this.count = count
  }

  async doCreate() {
    const {
      data: { id },
    } = await api.entryCreate(null, {
      ...this.selected,
      type: this.selected.type as any,
    })

    this.selected.id = id

    await this.context.addToQuiz()
    this.$buefy.snackbar.open(`Added ${this.selected.entry} to quiz`)

    this.isEditModal = false
    await this.load()
  }

  async doUpdate() {
    await api.entryUpdate(
      {
        id: this.selected.id,
      },
      {
        ...this.selected,
        type: this.selected.type as any,
      }
    )

    this.$buefy.snackbar.open(`Updated extra: ${this.selected.entry}`)

    this.isEditModal = false
    await this.load()
  }

  async doDelete() {
    await api.entryDelete({
      id: this.selected.id,
    })

    this.$buefy.snackbar.open(`Deleted extra: ${this.selected.entry}`)

    await this.load()
  }

  onNewItem() {
    this.selected = {
      id: '',
      entry: '',
      alt: [],
      reading: [],
      english: [],
      type: 'vocabulary',
      description: '',
      tag: [],
    }

    this.isEditModal = true
  }

  async onTableContextmenu(row: IExtra, evt: MouseEvent) {
    evt.preventDefault()

    this.selected = row
    await this.context.open(evt)
  }

  async onSort(key: string, type: string) {
    this.sort.key = key
    this.sort.type = type
    await this.load()
  }
}
</script>

<style lang="scss" scoped>
.b-table ::v-deep tr:hover {
  cursor: pointer;
  color: blue;
}

.button + .button {
  margin-left: 1rem;
}

.button.is-cancel {
  background-color: rgb(215, 217, 219);
}
</style>
