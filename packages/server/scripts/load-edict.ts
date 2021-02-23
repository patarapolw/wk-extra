import { DictModel, mongoConnect } from '@/db/mongo'
import { mongoose } from '@typegoose/typegoose'
import axios from 'axios'
import sqlite3 from 'better-sqlite3'
import hepburn from 'hepburn'

async function main() {
  const wk = sqlite3('../../data/edict.db')

  await mongoConnect()

  const items = wk
    .prepare(
      /* sql */ `
    SELECT
      [entry],
      reading,
      english
    FROM edict
    `
    )
    .all()
    .map((it) => {
      it.entry = JSON.parse(it.entry).map((el: string) =>
        el.replace(/\(.+\)$/, '')
      )
      return it
    })

  const fMap: Record<string, number> = await axios
    .post(
      'http://localhost:8000/wordfreq?lang=ja',
      Array.from(new Set(items.flatMap((it) => it.entry)))
    )
    .then((r) => r.data)

  const chunkSize = 10000
  for (let i = 0; i < items.length; i += chunkSize) {
    console.log(i)
    await DictModel.insertMany(
      items.slice(i, i + chunkSize).map((it) => {
        it.reading = JSON.parse(it.reading)
        if (!it.reading.length) {
          it.reading = it.entry
        }
        const frequency =
          Math.max(0, ...it.entry.map((el: string) => fMap[el])) || undefined

        return {
          entry: it.entry,
          reading: it.reading.map((r: string) => {
            return {
              kana: [r, hepburn.toHiragana(hepburn.fromKana(r))].filter(
                (a, i, arr) => arr.indexOf(a) === i
              ),
            }
          }),
          english: JSON.parse(it.english).map((r: string) => r),
          type: 'vocabulary',
          source: 'edict',
          frequency,
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
