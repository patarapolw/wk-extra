import 'log-buffer'

import fs from 'fs'

import createConnectionPool, { sql } from '@databases/pg'
// @ts-ignore
import { Iconv } from 'iconv'
import S from 'jsonschema-definer'
import XRegExp from 'xregexp'

async function readEdict(filename: string): Promise<ReturnType<typeof sql>[]> {
  const dbEdict = {
    lots: [] as ReturnType<typeof sql>[],
    insertOne({
      kanji,
      ...p
    }: {
      kanji: string
      onyomi: string[]
      kunyomi: string[]
      nanori: string[]
      english: string[]
    }) {
      this.lots.push(sql`(${kanji}, ${p})`)
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
  const db = createConnectionPool(process.env.DATABASE_URL)

  await db.query(sql`
  ALTER TABLE dict.kanji ADD CONSTRAINT "c_data" CHECK (validate_json_schema('${sql.__dangerous__rawValue(
    JSON.stringify(
      S.shape({
        kunyomi: S.list(S.string()),
        onyomi: S.list(S.string()),
        nanori: S.list(S.string()),
        english: S.list(S.string()),
      }).valueOf()
    )
  )}', "data"))
  `)

  await db.tx(async (db) => {
    const batchSize = 1000

    let lots = await readEdict('cache/kanjidic')

    for (let i = 0; i < lots.length; i += batchSize) {
      console.log('kanjidic', lots[i])
      await db.query(sql`
        INSERT INTO dict.kanji ("kanji", "data")
        VALUES ${sql.join(lots.slice(i, i + batchSize), ',')}
      `)
    }

    lots = await readEdict('cache/kanjd212')

    for (let i = 0; i < lots.length; i += batchSize) {
      console.log('kanjd212', lots[i])
      await db.query(sql`
        INSERT INTO dict.kanji ("kanji", "data")
        VALUES ${sql.join(lots.slice(i, i + batchSize), ',')}
      `)
    }
  })

  await db.dispose()
}

if (require.main === module) {
  main()
}
