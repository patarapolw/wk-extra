import 'log-buffer'

import fs from 'fs'

// @ts-ignore
import { Iconv } from 'iconv'
import XRegExp from 'xregexp'

/**
 * KANJI-1;KANJI-2 [KANA-1;KANA-2] /(general information) (see xxxx) gloss/gloss/.../
 *
 * 収集(P);蒐集;拾集;収輯 [しゅうしゅう] /(n,vs) gathering up/collection/accumulation/(P)/
 *
 * In addition, the EDICT2 has as its last field the sequence number of the entry.
 * This matches the "ent_seq" entity value in the XML edition. The field has the format: EntLnnnnnnnnX.
 * The EntL is a unique string to help identify the field.
 * The "X", if present, indicates that an audio clip of the entry reading is available from the JapanesePod101.com site.
 */
async function readEdict(filename: string) {
  const dbEdict = {
    // lots: [] as ReturnType<typeof sql>[],
    insertOne(p: {
      kanji: string
      onyomi: string[]
      kunyomi: string[]
      nanori: string[]
      english: string[]
    }) {
      // this.lots.push(sql`(${p.entry}, ${p.reading}, ${p.english})`)
      if (p.nanori.length) console.log(p)
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

  return new Promise<void>((resolve, reject) => {
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
        resolve()
      })
  })
}

async function main() {
  await readEdict('cache/kanjd212')

  // const db = createConnectionPool(process.env.DATABASE_URL)

  // await db.tx(async () => {
  //   const batchSize = 5000

  //   // let lots = await readEdict('cache/edict')
  //   // lots.shift()

  //   // for (let i = 0; i < lots.length; i += batchSize) {
  //   //   console.log('edict', lots[i])
  //   //   await db.query(sql`
  //   //     INSERT INTO "edict" ("entry", "reading", "english")
  //   //     VALUES ${sql.join(lots.slice(i, i + batchSize), ',')}
  //   //   `)
  //   // }

  //   const lots = await readEdict('cache/kanjidic')
  //   lots.shift()

  //   for (let i = 0; i < lots.length; i += batchSize) {
  //     console.log('edict2', lots[i])
  //   }
  // })

  // await db.dispose()
}

if (require.main === module) {
  main()
}
