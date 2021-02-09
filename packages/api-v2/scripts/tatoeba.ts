import fs from 'fs'

import createConnectionPool, { sql } from '@databases/pg'
import sqlite3 from 'better-sqlite3'

export async function insertSentence() {
  const s3 = sqlite3('cache/tatoeba.db')

  let s = ''

  s3.exec(/* sql */ `
  CREATE TABLE "sentence" (
    "id"        INT PRIMARY KEY NOT NULL,
    "lang"      TEXT NOT NULL,
    "sentence"  TEXT NOT NULL
  );

  CREATE INDEX idx_sentence_lang ON "sentence" ("lang");
  CREATE INDEX idx_sentence_sentence ON "sentence" ("sentence");
  `)

  const langSet = new Set(['eng', 'cmn', 'jpn'])
  const parseSent = {
    stmt: s3.prepare(/* sql */ `
    INSERT INTO "sentence" ("id", "lang", "sentence")
    VALUES (@id, @lang, @sentence)
    `),
    rss: [] as string[][],
    push(r: string) {
      const rs = r.split('\t')

      if (langSet.has(rs[1])) {
        this.rss.push(rs)
      }
    },
    insert() {
      console.log('inserting')

      s3.transaction(() => {
        this.rss.map((rs) => {
          this.stmt.run({
            id: Number(rs[0]),
            lang: rs[1],
            sentence: rs[2],
          })
        })
      })()

      this.rss = []
    },
  }

  await new Promise<void>((resolve, reject) => {
    fs.createReadStream('cache/sentences.csv')
      .on('data', (d) => {
        s += d.toString()
        const rows = s.split('\n')
        s = rows.pop() || ''

        rows.map((r) => {
          parseSent.push(r)
        })

        if (parseSent.rss.length > 1000) {
          parseSent.insert()
        }
      })
      .once('error', reject)
      .once('end', () => {
        parseSent.push(s)
        parseSent.insert()
        resolve()
      })
  })
}

export async function insertLinks() {
  const s3 = sqlite3('cache/tatoeba.db')

  let s = ''

  s3.exec(/* sql */ `
  CREATE TABLE "link" (
    "sentence_id"        INT NOT NULL,
    "translation_id"     INT NOT NULL,
    PRIMARY KEY ("sentence_id", "translation_id")
  );
  `)

  const ids = new Set<number>(
    s3
      .prepare(
        /* sql */ `
  SELECT "id" FROM "sentence"
  `
      )
      .all()
      .map(({ id }) => id)
  )

  const parseSent = {
    stmt: s3.prepare(/* sql */ `
    INSERT INTO "link" ("sentence_id", "translation_id")
    VALUES (@sid, @tid)
    `),
    rss: [] as number[][],
    push(r: string) {
      const rs = r.split('\t').map((s) => Number(s))

      if (ids.has(rs[1]) && ids.has(rs[0])) {
        this.rss.push(rs)
      }
    },
    insert() {
      console.log('inserting')

      s3.transaction(() => {
        this.rss.map((rs) => {
          this.stmt.run({
            sid: rs[0],
            tid: rs[1],
          })
        })
      })()

      this.rss = []
    },
  }

  await new Promise<void>((resolve, reject) => {
    fs.createReadStream('cache/links.csv')
      .on('data', (d) => {
        s += d.toString()
        const rows = s.split('\n')
        s = rows.pop() || ''

        rows.map((r) => {
          parseSent.push(r)
        })

        if (parseSent.rss.length > 1000) {
          parseSent.insert()
        }
      })
      .once('error', reject)
      .once('end', () => {
        parseSent.push(s)
        parseSent.insert()
        resolve()
      })
  })
}

export async function makePair() {
  const s3 = sqlite3('cache/tatoeba.db')

  console.log(
    s3
      .prepare(
        /* sql */ `
  SELECT
    s1.id       id,
    s1.sentence sentence,
    json_group_object(
      s2.lang,
      json_object('id', s2.id, 'sentence', s2.sentence)
    ) translation
  FROM sentence s1
  JOIN link t       ON t.sentence_id = s1.id
  JOIN sentence s2  ON t.translation_id = s2.id
  WHERE s1.lang = 'eng' AND (s2.lang = 'jpn' OR s2.lang = 'cmn')
  GROUP BY s1.id
  `
      )
      .all()
  )
}

export async function clean() {
  const s3 = sqlite3('cache/tatoeba.db')

  s3.prepare(
    /* sql */ `
  DELETE FROM "sentence"
  WHERE id NOT IN (
    SELECT json_each.value
    FROM (
      SELECT
        json_array(s1.id, s2.id) id
      FROM sentence s1
      JOIN link t       ON t.sentence_id = s1.id
      JOIN sentence s2  ON t.translation_id = s2.id
      WHERE s1.lang = 'eng' AND (s2.lang = 'jpn' OR s2.lang = 'cmn')
    ) t, json_each(t.id)
  )
  `
  ).run()
}

export async function upload() {
  const db = createConnectionPool(process.env.DATABASE_URL)

  const s3 = sqlite3('cache/tatoeba.db')

  await db.tx(async (db) => {
    const batchSize = 10000

    let lots = s3
      .prepare(
        /* sql */ `
    SELECT id, lang, sentence "text" FROM "sentence"
    `
      )
      .all()
      .map(({ id, lang, text }) => sql`(${id}, ${lang}, ${text})`)

    for (let i = 0; i < lots.length; i += batchSize) {
      console.log('sentence', lots[i])
      await db.query(sql`
        INSERT INTO dict.tatoeba ("id", "lang", "text")
        VALUES ${sql.join(lots.slice(i, i + batchSize), ',')}
      `)
    }

    lots = s3
      .prepare(
        /* sql */ `
    SELECT sentence_id, translation_id FROM "link"
    `
      )
      .all()
      .map(
        ({ sentence_id, translation_id }) =>
          sql`(${sentence_id}, ${translation_id})`
      )

    for (let i = 0; i < lots.length; i += batchSize) {
      console.log('link', lots[i])
      await db.query(sql`
        INSERT INTO dict.tatoebaLink ("sentenceId", "translationId")
        VALUES ${sql.join(lots.slice(i, i + batchSize), ',')}
      `)
    }
  })

  await db.dispose()
}

if (require.main === module) {
  upload()
}
