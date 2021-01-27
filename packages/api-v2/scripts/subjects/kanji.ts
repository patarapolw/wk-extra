import { ICollection, IResource, wkApi } from '@/wk/wanikani'
import sqlite3 from 'better-sqlite3'
import S from 'jsonschema-definer'

async function main() {
  const db = sqlite3('../../data/wanikani.db')

  const sKanji = S.shape({
    level: S.integer(),
    characters: S.string(),
    meanings: S.list(
      S.shape({
        meaning: S.string(),
        primary: S.boolean(),
      }).additionalProperties(true)
    ),
    readings: S.list(
      S.shape({
        type: S.string().enum('onyomi', 'kunyomi', 'nanori'),
        primary: S.boolean(),
        reading: S.string(),
      }).additionalProperties(true)
    ),
    component_subject_ids: S.list(S.integer()),
    amalgamation_subject_ids: S.list(S.integer()),
    visually_similar_subject_ids: S.list(S.integer()),
    meaning_mnemonic: S.string(),
    meaning_hint: S.anyOf(S.string(), S.null()),
    reading_mnemonic: S.string(),
    reading_hint: S.anyOf(S.string(), S.null()),
  }).additionalProperties(true)

  const stmt = db.prepare(/* sql */ `
  INSERT INTO "kanji" ("id", "data_updated_at", "url", "data")
  VALUES (@id, @data_updated_at, @url, @data)
  `)

  let nextUrl = '/subjects?types=kanji'

  while (true) {
    const r = await wkApi.get<
      ICollection<
        IResource<typeof sKanji.type> & {
          id: number
          object: 'kanji'
          data_updated_at: string
          url: string
        }
      >
    >(nextUrl)

    db.transaction(() => {
      for (const d of r.data.data) {
        if (d.object !== 'kanji') {
          throw new Error('not Kanji')
        }

        stmt.run({
          ...d,
          data: JSON.stringify(sKanji.ensure(d.data)),
        })
      }
    })()

    console.log(r.data.url)

    nextUrl = r.data.pages.next_url || ''
    if (!nextUrl) {
      break
    }
  }
}

if (require.main === module) {
  main().catch(console.error)
}
