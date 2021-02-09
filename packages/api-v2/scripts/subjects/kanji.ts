import { ICollection, IResource, wkApi } from '@/wk/wanikani'
import createConnectionPool, { sql } from '@databases/pg'
import S from 'jsonschema-definer'

async function main() {
  const db = createConnectionPool(process.env.DATABASE_URL)

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

    await db.tx(async (db) => {
      const lots: ReturnType<typeof sql>[] = []

      for (const d of r.data.data) {
        if (d.object !== 'kanji') {
          throw new Error('not Kanji')
        }

        sKanji.ensure(d.data)

        lots.push(
          sql`(${d.id}, ${new Date(d.data_updated_at)}, ${d.object}, ${
            d.url
          }, ${d.data})`
        )
      }

      const batchSize = 100
      for (let i = 0; i < lots.length; i += batchSize) {
        await db.query(sql`
          INSERT INTO wanikani.subjects ("id", "data_updated_at", "object", "url", "data")
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
