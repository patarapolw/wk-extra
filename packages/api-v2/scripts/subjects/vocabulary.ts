import { ICollection, IResource, wkApi } from '@/wk/wanikani'
import createConnectionPool, { sql } from '@databases/pg'
import S from 'jsonschema-definer'

async function main() {
  const db = createConnectionPool(process.env.DATABASE_URL)

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

  let nextUrl = '/subjects?types=vocabulary'

  while (true) {
    const r = await wkApi.get<
      ICollection<
        IResource<typeof sVocabulary.type> & {
          id: number
          object: 'vocabulary'
          data_updated_at: string
          url: string
        }
      >
    >(nextUrl)

    await db.tx(async (db) => {
      const lots: ReturnType<typeof sql>[] = []

      for (const d of r.data.data) {
        if (d.object !== 'vocabulary') {
          throw new Error('not Vocabulary')
        }

        sVocabulary.ensure(d.data)

        lots.push(
          sql`(${d.id}, ${new Date(d.data_updated_at)}, ${d.object}, ${
            d.url
          }, ${d.data})`
        )
      }

      const batchSize = 100
      for (let i = 0; i < lots.length; i += batchSize) {
        await db.query(sql`
          INSERT INTO "wkSubjects" ("id", "data_updated_at", "object", "url", "data")
          VALUES ${sql.join(lots.slice(i, i + batchSize), ',')}
        `)
      }
    })

    console.log(r.data.url)

    nextUrl = r.data.pages.next_url || ''
    if (!nextUrl) {
      break
    }
  }

  await db.dispose()
}

if (require.main === module) {
  main().catch(console.error)
}
