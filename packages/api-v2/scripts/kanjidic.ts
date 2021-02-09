import 'log-buffer'

import fs from 'fs'

import createConnectionPool, { sql } from '@databases/sqlite'
// @ts-ignore
import { Iconv } from 'iconv'
import XRegExp from 'xregexp'

async function readEdict(filename: string): Promise<ReturnType<typeof sql>[]> {
  const dbEdict = {
    lots: [] as ReturnType<typeof sql>[],
    insertOne(p: {
      kanji: string
      onyomi: string[]
      kunyomi: string[]
      nanori: string[]
      english: string[]
    }) {
      this.lots.push(
        sql`(${p.kanji}, ${JSON.stringify(p.onyomi)}, ${JSON.stringify(
          p.kunyomi
        )}, ${JSON.stringify(p.nanori)}, ${JSON.stringify(p.english)})`
      )
    },
  }

  const parseRow = (r: string) => {
    let [kanji, remaining] = r.split(/ (.+)$/)
    const onyomi: string[] = []
    const kunyomi: string[] = []
    const nanori: string[] = []

    if (!kanji || !remaining || kanji[0] === '#') {
      return
    }

    let isNanori = false
    while (true) {
      const [seg, r1] = remaining.split(/ (.+)$/)
      if (!seg || !r1) {
        break
      }
      remaining = r1

      if (remaining[0] === '{') {
        break
      }

      if (seg[0] === 'T') {
        isNanori = true
        continue
      }

      if (XRegExp('\\p{Katakana}').test(seg)) {
        onyomi.push(seg)
      } else if (XRegExp('\\p{Hiragana}').test(seg)) {
        if (isNanori) {
          nanori.push(seg)
        } else {
          kunyomi.push(seg)
        }
      }
    }

    const english: string[] = []
    XRegExp.forEach(remaining, /{(.+?)}/g, ([_, p1]) => {
      english.push(p1)
    })

    dbEdict.insertOne({
      kanji,
      onyomi,
      kunyomi,
      nanori,
      english,
    })
  }

  return new Promise((resolve, reject) => {
    let s = ''
    fs.createReadStream(filename)
      .pipe(new Iconv('EUC-JP', 'UTF-8'))
      .on('data', (d: Buffer) => {
        s += d.toString()
        const rows = s.split('\n')
        s = rows.splice(rows.length - 1, 1)[0]
        rows.map((r) => {
          parseRow(r)
        })
      })
      .on('error', reject)
      .on('end', async () => {
        parseRow(s)
        resolve(dbEdict.lots)
      })
  })
}

async function main() {
  const db = createConnectionPool('cache/kanjidic.db')

  await db.query(sql`
  CREATE TABLE IF NOT EXISTS "kanji" (
    "kanji"     TEXT NOT NULL PRIMARY KEY,
    "onyomi"    JSON NOT NULL,
    "kunyomi"   JSON NOT NULL,
    "nanori"    JSON NOT NULL,
    "english"   JSON NOT NULL
  )
  `)

  await db.tx(async (db) => {
    const batchSize = 150

    let lots = await readEdict('cache/kanjidic')

    for (let i = 0; i < lots.length; i += batchSize) {
      console.log('kanjidic', lots[i])
      await db.query(sql`
        INSERT INTO "kanji" ("kanji", "onyomi", "kunyomi", "nanori", "english")
        VALUES ${sql.join(lots.slice(i, i + batchSize), ',')}
      `)
    }

    lots = await readEdict('cache/kanjd212')

    for (let i = 0; i < lots.length; i += batchSize) {
      console.log('kanjd212', lots[i])
      await db.query(sql`
        INSERT INTO "kanji" ("kanji", "onyomi", "kunyomi", "nanori", "english")
        VALUES ${sql.join(lots.slice(i, i + batchSize), ',')}
      `)
    }
  })

  await db.dispose()
}

if (require.main === module) {
  main()
}
