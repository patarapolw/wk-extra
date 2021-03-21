import dayjs from 'dayjs'

type Query = Record<string, unknown>

export class QSplit {
  constructor(
    private opts: {
      default: (v: string) => Query
      fields: {
        [name: string]: {
          [op: string]: (v: string) => Query
        }
      }
    }
  ) {}

  parse(q?: string) {
    if (!q) {
      return null
    }

    const $and: Query[] = []
    const $or: Query[] = []
    const $not: Query[] = []

    const ops = new Set(
      Object.values(this.opts.fields).flatMap((def) => Object.keys(def))
    )
    for (let kv of this.doSplit(q, ' ')) {
      let $current = $and
      if (kv[0] === '-') {
        $current = $not
        kv = kv.substr(1)
      } else if (kv[0] === '?') {
        $current = $or
        kv = kv.substr(1)
      }

      for (const op of ops) {
        const segs = this.doSplit(kv, op)

        if (segs.length === 1) {
          $current.push(this.opts.default(segs[0]!))
        } else if (segs.length === 2) {
          const fnMap = this.opts.fields[segs[0]!]
          if (!fnMap) continue

          const fn = fnMap[op]
          if (!fn) continue

          $current.push(fn(segs[1]!))
        }
      }
    }

    if ($or.length) {
      $and.push({ $or })
    }

    if ($not.length) {
      $and.push({ $nor: $not })
    }

    switch ($and.length) {
      case 0:
        return null
      case 1:
        return $and[0]
    }

    return { $and }
  }

  /**
   * ```js
   * > this.doSplit('')
   * []
   * > this.doSplit('a:b "c:d e:f"')
   * ['a:b', 'c:d e:f']
   * > this.doSplit('a "b c" "d e"')
   * ['a', 'b c', 'd e']
   * ```
   */
  private doSplit(ss: string, splitter: string) {
    const brackets = [
      ['"', '"'],
      ["'", "'"],
    ] as const
    const keepBraces = false

    const bracketStack = {
      data: [] as string[],
      push(c: string) {
        this.data.push(c)
      },
      pop() {
        return this.data.pop()
      },
      peek() {
        return this.data.length > 0
          ? this.data[this.data.length - 1]
          : undefined
      },
    }
    const tokenStack = {
      data: [] as string[],
      currentChars: [] as string[],
      addChar(c: string) {
        this.currentChars.push(c)
      },
      flush() {
        const d = this.currentChars.join('')
        if (d) {
          this.data.push(d)
        }
        this.currentChars = []
      },
    }

    let prev = ''
    ss.split('').map((c) => {
      if (prev === '\\') {
        tokenStack.addChar(c)
      } else {
        let canAddChar = true

        for (const [op, cl] of brackets) {
          if (c === cl) {
            if (bracketStack.peek() === op) {
              bracketStack.pop()
              canAddChar = false
              break
            }
          }

          if (c === op) {
            bracketStack.push(c)
            canAddChar = false
            break
          }
        }

        if (c === splitter && !bracketStack.peek()) {
          tokenStack.flush()
        } else {
          if (keepBraces || canAddChar) {
            tokenStack.addChar(c)
          }
        }
      }

      prev = c
    })

    tokenStack.flush()

    return tokenStack.data.map((s) => s.trim()).filter((s) => s)
  }
}

export function qNumberUndefined(
  k: string
): {
  [op: string]: (v: string) => Query
} {
  return {
    ':': (v) =>
      v === 'NULL' ? { [k]: { $exists: false } } : { [k]: parseInt(v) },
    '>': (v) => ({ [k]: { $gt: parseInt(v) } }),
    '<': (v) => ({ [k]: { $lt: parseInt(v) } }),
  }
}

function parseDate(v: string): { d: dayjs.Dayjs; u: dayjs.OpUnitType } | null {
  {
    const [, ns = '', us] = /^([-+]?\d(?:[.]\d+)?)([A-Z]{1,8})$/.exec(v) || []
    if (us) {
      const n = parseFloat(ns)
      const u = us as dayjs.OpUnitType
      const d = dayjs().add(n, u as dayjs.OpUnitType)
      if (d.isValid()) {
        return { d, u }
      }
    }
  }

  {
    const [, hs = '', ms] = /^\d{2}:\d{2}$/.exec(v) || []
    if (ms) {
      const h = parseInt(hs)
      const min = parseInt(ms)

      if (h >= 0 && h <= 24 && min >= 0 && min < 60) {
        const d = dayjs().set('h', h).set('minute', min)
        if (d.isValid()) {
          return { d, u: 'hour' }
        }
      }
    }
  }

  {
    if (/^\d{4}-\d{2}-\d{2}/.test(v)) {
      const d = dayjs(v)
      if (d.isValid()) {
        return { d, u: 'day' }
      }
    }
  }

  return null
}

export function qDateUndefined(
  k: string
): {
  [op: string]: (v: string) => Query
} {
  return {
    ':': (v) =>
      v === 'NULL'
        ? { [k]: { $exists: false } }
        : (() => {
            const d = parseDate(v)
            if (!d) {
              return { [Math.random()]: 1 }
            }

            return {
              $and: [
                {
                  [k]: {
                    $gt: d.d.subtract(0.5, d.u).toDate(),
                    $lt: d.d.add(0.5, d.u).toDate(),
                  },
                },
              ],
            }
          })(),
    '>': (v) => {
      const d = parseDate(v)
      if (!d) {
        return { [Math.random()]: 1 }
      }

      return { [k]: { $gt: d.d.toDate() } }
    },
    '<': (v) => {
      const d = parseDate(v)
      if (!d) {
        return { [Math.random()]: 1 }
      }

      return { [k]: { $gt: d.d.toDate() } }
    },
  }
}
