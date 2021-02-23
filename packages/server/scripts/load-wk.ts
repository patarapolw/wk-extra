import { DictModel, mongoConnect } from '@/db/mongo'
import { mongoose } from '@typegoose/typegoose'
import sqlite3 from 'better-sqlite3'
import hepburn from 'hepburn'

async function main() {
  const wk = sqlite3(`${__dirname}/wanikani.db`)

  await mongoConnect()

  const items = wk
    .prepare(
      /* sql */ `
    SELECT
      [object] [type],
      json_extract([data], '$.level') [level],
      json_extract([data], '$.characters') characters,
      json_extract([data], '$.meanings') meanings,
      json_extract([data], '$.readings') readings,
      json_extract([data], '$.pronunciation_audios') audio
    FROM subjects
    `
    )
    .all()

  const chunkSize = 1000
  for (let i = 0; i < items.length; i += chunkSize) {
    console.log(i)
    await DictModel.insertMany(
      items.slice(i, i + chunkSize).map((it) => ({
        entry: [it.characters],
        reading: JSON.parse(it.readings).map((r: any) => {
          return {
            type: r.type,
            kana: [
              r.reading,
              hepburn.toHiragana(hepburn.fromKana(r.reading)),
            ].filter((a, i, arr) => arr.indexOf(a) === i),
          }
        }),
        english: JSON.parse(it.meanings).map((r: any) => r.meaning),
        type: it.type,
        level: it.level,
        source: 'wanikani',
        audio: (JSON.parse(it.audio || '[]') as any[]).reduce((prev, c) => {
          const k = c.metadata.voice_actor_id
          if (prev[k] && c.content_type === 'audio/ogg') {
            return prev
          }

          return {
            ...prev,
            [k]: c.url,
          }
        }, {} as any),
      }))
    )
  }

  wk.close()

  console.log('disconnecting')
  await mongoose.disconnect()
  console.log('disconnected')
}

if (require.main === module) {
  main()
}
