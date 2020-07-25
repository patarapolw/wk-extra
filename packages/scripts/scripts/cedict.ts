import sqlite3 from 'better-sqlite3'
import S from 'jsonschema-definer'

import { db, dbCedict, dbInit, ensureSchema, sCedict } from '@/dict'

async function main() {
  const sql = sqlite3(
    '/Users/patarapolw/projects/zhquiz-v2/packages/server/assets/zh.db',
    { readonly: true }
  )

  const addSpaceToSlash = (s: string) => {
    ensureSchema(S.string(), s)

    const indices = indicesOf(s, '/')
    if (indices.length > 0) {
      indices.map((c, i) => {
        c += i * 2
        s = s.substr(0, c) + ' / ' + s.substr(c + 1)
      })
    }

    return s
  }

  await dbInit()

  const vMap = new Map<string, any[]>()
  sql
    .prepare(
      /* sql */ `
  SELECT simplified, traditional, v.pinyin pinyin, v.english english, frequency
  FROM vocab v
  LEFT JOIN token t ON simplified = [entry]
  `
    )
    .all()
    .map(({ simplified, traditional, pinyin, english }) => {
      const data = vMap.get(simplified) || []
      data.push({ traditional, pinyin, english })
      vMap.set(simplified, data)
    })

  dbCedict.insert(
    Array.from(vMap).flatMap(([simplified, vs]) => {
      const tradSet = new Set<string>()
      const pinSet = new Set<string>()
      const engSet = new Set<string>()
      const freqSet = new Set<number>()

      vs.map(({ traditional, pinyin, english, frequency }) => {
        if (traditional) {
          tradSet.add(traditional)
        }
        pinSet.add(pinyin)
        engSet.add(addSpaceToSlash(english))
        if (frequency) {
          freqSet.add(frequency)
        }
      })

      return ensureSchema(sCedict, {
        entry: simplified,
        alt: tradSet.size ? Array.from(tradSet).sort() : undefined,
        reading: Array.from(pinSet).sort(),
        english: Array.from(engSet).sort(),
      })
    })
  )

  db.save(() => {
    db.close()
  })

  sql.close()
}

function notSpace(c: string) {
  return c && c !== ' '
}

function indicesOf(str: string, c: string) {
  const indices: number[] = []
  for (let i = 0; i < str.length; i++) {
    if (str[i] === c && notSpace(str[i - 1]) && notSpace(str[i + 1])) {
      indices.push(i)
    }
  }

  return indices
}

if (require.main === module) {
  main()
}
