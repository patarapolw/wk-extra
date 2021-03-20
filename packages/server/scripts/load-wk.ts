import { DictModel, mongoConnect } from '@/db/mongo'
import { mongoose } from '@typegoose/typegoose'
import axios from 'axios'
import sqlite3 from 'better-sqlite3'
import { katakanaToHiragana } from 'jskana'

async function main() {
  const wk = sqlite3(`../api-v2/cache/wanikani.db`)

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

  const fMap: Record<string, number> = await axios
    .post(
      'http://localhost:8000/wordfreq?lang=ja',
      items.map((it) => it.characters)
    )
    .then((r) => r.data)

  const chunkSize = 1000
  for (let i = 0; i < items.length; i += chunkSize) {
    console.log(i)
    await DictModel.insertMany(
      items.slice(i, i + chunkSize).map((it) => {
        return {
          entry: [it.characters],
          reading: JSON.parse(it.readings).flatMap((r: any) => {
            const out: {
              type: string
              kana: string
              hidden?: boolean
            }[] = [
              {
                type: r.type,
                kana: r.reading,
              },
            ]

            if (/\p{sc=Katakana}/.test(r.reading)) {
              out.push({
                type: r.type,
                kana: katakanaToHiragana(r.reading),
                hidden: true,
              })
            }

            return out
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
          frequency: fMap[it.characters],
        }
      })
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
