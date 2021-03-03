import { DictModel, mongoConnect } from '@/db/mongo'
import { mongoose } from '@typegoose/typegoose'
import axios from 'axios'
import sqlite3 from 'better-sqlite3'
import hepburn from 'hepburn'

async function main() {
  const wk = sqlite3('../../data/kanjidic.db')

  await mongoConnect()

  const items = wk
    .prepare(
      /* sql */ `
    SELECT
      kanji,
      onyomi,
      kunyomi,
      nanori,
      english
    FROM kanji
    `
    )
    .all()

  const fMap: Record<string, number> = await axios
    .post(
      'http://localhost:8000/wordfreq?lang=ja',
      items.map((it) => it.kanji)
    )
    .then((r) => r.data)

  console.log(fMap)

  const chunkSize = 1000
  for (let i = 0; i < items.length; i += chunkSize) {
    console.log(i)
    await DictModel.insertMany(
      items.slice(i, i + chunkSize).map((it) => {
        return {
          entry: it.kanji,
          reading: [
            ...JSON.parse(it.kunyomi).map((r: string) => {
              const rs = [r, r.replace('.', '')]
              rs.push(...rs.map((r) => hepburn.toHiragana(hepburn.fromKana(r))))

              return {
                type: 'kunyomi',
                kana: rs.filter((a, i, arr) => arr.indexOf(a) === i),
              }
            }),
            ...JSON.parse(it.onyomi).map((r: string) => ({
              type: 'onyomi',
              kana: [r, hepburn.toHiragana(hepburn.fromKana(r))].filter(
                (a, i, arr) => arr.indexOf(a) === i
              ),
            })),
            ...JSON.parse(it.nanori).map((r: string) => ({
              type: 'nanori',
              kana: [r, hepburn.toHiragana(hepburn.fromKana(r))].filter(
                (a, i, arr) => arr.indexOf(a) === i
              ),
            })),
          ],
          english: JSON.parse(it.english).map((r: string) => r),
          type: 'kanji',
          source: 'kanjidic',
          frequency: fMap[it.kanji],
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
