import fs from 'fs'

import createConnectionPool, { sql } from '@databases/sqlite'
import sqlite3 from 'better-sqlite3'

async function main() {
  const db = createConnectionPool('cache/cedict.db')
  const zh = sqlite3(
    '/home/polv/projects/zhquiz/submodules/go-zhquiz/assets/zh.db'
  )
  const stmt = zh.prepare(/* sql */ `
  SELECT frequency f FROM vocab WHERE simplified = @simplified AND COALESCE(traditional = @traditional, TRUE) AND pinyin = @pinyin
  `)

  const dbCedict = {
    lots: [] as ReturnType<typeof sql>[],
    insertOne(r: string) {
      if (!r || r[0] === '#') {
        return
      }

      r = r.trim()

      const m = new RegExp('^([^ ]+) ([^ ]+) \\[([^\\]]+)\\] /(.+)/$').exec(r)

      if (!m) {
        return
      }

      const p = {
        simplified: m[1],
        traditional: m[2] === m[1] ? null : m[2],
        pinyin: m[3],
      }

      const { f = null } = stmt.get(p) || {}

      this.lots.push(
        sql`(${m[1]}, ${p.traditional}, ${m[3]}, ${JSON.stringify(
          m[4].split('/')
        )}, ${f})`
      )
    },
  }

  const rows = fs
    .readFileSync('cache/cedict_1_0_ts_utf-8_mdbg.txt', 'utf-8')
    .split('\n')
  rows.map((r) => {
    dbCedict.insertOne(r)
  })

  await db.query(sql`
    CREATE TABLE cedict (
      simplified      TEXT NOT NULL,
      traditional     TEXT,
      reading         TEXT NOT NULL,
      english         JSON NOT NULL,
      frequency       FLOAT
    );

    CREATE UNIQUE INDEX idx_cedict_u ON cedict(simplified, traditional, reading);
    CREATE INDEX idx_cedict_simplified ON cedict(simplified);
    CREATE INDEX idx_cedict_traditional ON cedict(traditional);
    CREATE INDEX idx_cedict_reading ON cedict(reading);
  `)

  await db.tx(async (db) => {
    const batchSize = 100

    const lots = dbCedict.lots

    for (let i = 0; i < lots.length; i += batchSize) {
      await db.query(sql`
        INSERT INTO cedict (simplified, traditional, reading, english, frequency)
        VALUES ${sql.join(lots.slice(i, i + batchSize), ',')}
      `)
    }
  })

  await db.dispose()
}

if (require.main === module) {
  main()
}
