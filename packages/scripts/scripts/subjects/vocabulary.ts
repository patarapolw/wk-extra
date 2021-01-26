import { ICollection, IResource, wkApi } from '@/wk/wanikani'
import sqlite3 from 'better-sqlite3'
import S from 'jsonschema-definer'

async function main() {
  const db = sqlite3('../../data/wanikani.db')

  const sVocabulary = S.shape({
    level: S.integer(),
    characters: S.string(),
    pronunciation_audios: S.list(
      S.shape({
        url: S.string(),
        metadata: S.shape({
          gender: S.string().enum('male', 'female'),
          voice_actor_id: S.integer(),
          voice_actor_name: S.string(),
          voice_description: S.string(),
        }).additionalProperties(true),
        content_type: S.string().enum('audio/mpeg', 'audio/ogg'),
      })
    ),
    readings: S.list(
      S.shape({
        primary: S.boolean(),
        reading: S.string(),
      }).additionalProperties(true)
    ),
    meanings: S.list(
      S.shape({
        primary: S.boolean(),
        meaning: S.string(),
      }).additionalProperties(true)
    ),
    auxiliary_meanings: S.list(
      S.shape({
        type: S.string(),
        meaning: S.string(),
      })
    ),
    context_sentences: S.list(
      S.shape({
        en: S.string(),
        ja: S.string(),
      })
    ),
    component_subject_ids: S.list(S.integer()),
    meaning_mnemonic: S.string(),
    reading_mnemonic: S.string(),
  }).additionalProperties(true)

  const stmt = db.prepare(/* sql */ `
  INSERT INTO "vocabulary" ("id", "data_updated_at", "url", "data")
  VALUES (@id, @data_updated_at, @url, @data)
  `)

  let nextUrl = '/subjects?types=vocabulary'

  while (true) {
    const r = await wkApi.get<
      ICollection<
        IResource<typeof sVocabulary.type> & {
          id: number
          data_updated_at: string
          url: string
        }
      >
    >(nextUrl)

    db.transaction(() => {
      for (const d of r.data.data) {
        stmt.run({
          ...d,
          data: JSON.stringify(sVocabulary.ensure(d.data)),
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
