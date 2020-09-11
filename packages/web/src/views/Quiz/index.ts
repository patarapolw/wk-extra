import { Component, Vue } from 'vue-property-decorator'

type TreeviewItem<ID = undefined> = (ID extends undefined ? {
  name?: string;
} : {
  id: ID;
  name: string;
}) & {
  children?: TreeviewItem<ID>[];
  level?: {
    from: number;
    to: number;
  } | number;
  stats?: {
    new: number;
    due: number;
    leech: number;
  };
}

@Component<Quiz>({
  created () {
    this.treeviewParsed = this.makeTreeview(this.treeview)
  }
})
export default class Quiz extends Vue {
  readonly treeview: TreeviewItem[] = [
    {
      name: '快 PLEASANT',
      level: {
        from: 1,
        to: 10
      }
      // stats: {
      //   due: 100000,
      //   new: 100000,
      //   leech: 1000001
      // }
    },
    {
      name: '苦 PAINFUL',
      level: {
        from: 11,
        to: 20
      }
    },
    {
      name: '死 DEATH',
      level: {
        from: 21,
        to: 30
      }
    },
    {
      name: '地獄 HELL',
      level: {
        from: 31,
        to: 40
      }
    },
    {
      name: '天国 PARADISE',
      level: {
        from: 41,
        to: 50
      }
    },
    {
      name: '現実 REALITY',
      level: {
        from: 51,
        to: 60
      }
    }
  ]

  quizOptions: Record<string, {
    name: string;
    isOpen: boolean;
    values: Record<string, {
      name: string;
      selected: boolean;
    }>;
  }> = {
    type: {
      name: 'Type',
      isOpen: true,
      values: {
        kanji: {
          name: 'Kanji',
          selected: true
        },
        vocab: {
          name: 'Vocab',
          selected: true
        },
        sentence: {
          name: 'Sentence',
          selected: false
        }
      }
    },
    direction: {
      name: 'Direction',
      isOpen: true,
      values: {
        reading: {
          name: 'Reading',
          selected: true
        },
        meaning: {
          name: 'Meaning',
          selected: true
        },
        revMeaning: {
          name: 'Reversed',
          selected: false
        }
      }
    },
    stage: {
      name: 'Learning stage',
      isOpen: false,
      values: {
        new: {
          name: 'New',
          selected: true
        },
        learning: {
          name: 'Learning',
          selected: true
        },
        graduated: {
          name: 'Graduated',
          selected: false
        }
      }
    },
    status: {
      name: 'Quiz status',
      isOpen: false,
      values: {
        due: {
          name: 'Due',
          selected: true
        },
        leech: {
          name: 'Leech',
          selected: true
        },
        toCome: {
          name: 'To come',
          selected: false
        }
      }
    }
  }

  treeviewSelection: string[] = []
  treeviewParsed: TreeviewItem<string>[] = []

  get expanded (): number[] {
    return Object.values(this.quizOptions)
      .filter((v) => v.isOpen)
      .map((_, i) => i)
  }

  get quizStats (): Record<string, number> {
    return {
      due: 0,
      new: 0,
      leech: 0
    }
  }

  startQuiz () {
    // Unimplemented
  }

  makeTreeview (tree: TreeviewItem[], parent?: string): TreeviewItem<string>[] {
    return tree.map((t) => {
      let name = t.name
      if (t.level) {
        if (typeof t.level === 'number') {
          name = `Level ${t.level}`
        } else {
          t.children = t.children || []
          let i = 0
          for (let lv = t.level.from; lv <= t.level.to; lv++, i++) {
            const node = t.children[i] || {}
            node.level = lv
            t.children[i] = node
          }
        }
      }

      name = name || Math.random().toString(36)

      const id = parent ? `${parent}/${name}` : name
      this.treeviewSelection.push(id)

      return {
        ...t,
        id,
        name,
        children: t.children ? this.makeTreeview(t.children, t.name) : undefined
      }
    })
  }
}
