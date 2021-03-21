import { EntryModel, mongoConnect } from '@/db/mongo'
import { mongoose } from '@typegoose/typegoose'
import axios from 'axios'
import sqlite3 from 'better-sqlite3'
import { katakanaToHiragana } from 'jskana'

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

  const chunkSize = 1000
  for (let i = 0; i < items.length; i += chunkSize) {
    console.log(i)
    await EntryModel.insertMany(
      items.slice(i, i + chunkSize).map((it) => {
        return {
          entry: it.kanji,
          reading: [
            ...JSON.parse(it.kunyomi).flatMap((r: string) => {
              const out: {
                type: 'kunyomi'
                kana: string
                hidden?: boolean
              }[] = [
                {
                  type: 'kunyomi',
                  kana: r,
                },
              ]

              if (r.includes('.')) {
                out.push({
                  type: 'kunyomi',
                  kana: r.replace('.', ''),
                  hidden: true,
                })
              }

              return out
            }),
            ...JSON.parse(it.onyomi).flatMap((r: string) => [
              {
                type: 'onyomi',
                kana: r,
              },
              {
                type: 'onyomi',
                kana: katakanaToHiragana(r),
                hidden: true,
              },
            ]),
            ...JSON.parse(it.nanori).flatMap((r: string) => {
              const out: {
                type: 'nanori'
                kana: string
                hidden?: boolean
              }[] = [
                {
                  type: 'nanori',
                  kana: r,
                },
              ]

              if (/\p{sc=Katakana}/u.test(r)) {
                out.push({
                  type: 'nanori',
                  kana: katakanaToHiragana(r),
                  hidden: true,
                })
              }

              return out
            }),
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
