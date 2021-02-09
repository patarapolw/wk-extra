import fs from 'fs'

import createConnectionPool, { sql } from '@databases/pg'
// @ts-ignore
import { Iconv } from 'iconv'

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
async function readEdict(filename: string): Promise<ReturnType<typeof sql>[]> {
  const dbEdict = {
    lots: [] as ReturnType<typeof sql>[],
    insertOne(p: { entry: string[]; reading: string[]; english: string[] }) {
      this.lots.push(sql`(${p.entry}, ${p.reading}, ${p.english})`)
    },
  }

  const parseRow = (r: string) => {
    let [ks, remaining = ''] = r.split(/ (.*)$/g)
    if (!ks) {
      return
    }

    const kanjis = ks.split(';')

    let readings: string[] = []
    if (remaining.startsWith('[')) {
      const [rs, remaining1 = ''] = remaining.slice(1).split(/\] (.*)$/g)
      readings = rs.split(';')
      remaining = remaining1
    }

    const infos: string[] = []
    let meanings: string[] = []
    if (remaining.startsWith('/')) {
      meanings = remaining
        .slice(1)
        .split('/')
        .filter((r) => r)
      if (meanings[0]) {
        meanings[0] = meanings[0]
          .replace(/\((.+?)\)/g, (_, p1) => {
            infos.push(p1)
            return ''
          })
          .trim()
      }

      const last = meanings[meanings.length - 1] || ''
      if (last.startsWith('EntL')) {
        meanings.pop()
      }
    }

    dbEdict.insertOne({
      entry: kanjis,
      reading: readings,
      english: meanings,
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

  await db.tx(async (db) => {
    const batchSize = 5000

    // let lots = await readEdict('cache/edict')
    // lots.shift()

    // for (let i = 0; i < lots.length; i += batchSize) {
    //   console.log('edict', lots[i])
    //   await db.query(sql`
    //     INSERT INTO "edict" ("entry", "reading", "english")
    //     VALUES ${sql.join(lots.slice(i, i + batchSize), ',')}
    //   `)
    // }

    const lots = await readEdict('cache/edict2')
    lots.shift()

    for (let i = 0; i < lots.length; i += batchSize) {
      console.log('edict2', lots[i])
      await db.query(sql`
        INSERT INTO "edict" ("entry", "reading", "english")
        VALUES ${sql.join(lots.slice(i, i + batchSize), ',')}
      `)
    }
  })

  await db.dispose()
}

if (require.main === module) {
  main()
}
