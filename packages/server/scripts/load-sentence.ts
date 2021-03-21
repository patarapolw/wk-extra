import { initKuromoji, kuromoji } from '@/db/kuro'
import { EntryModel, mongoConnect } from '@/db/mongo'
import { mongoose } from '@typegoose/typegoose'
import sqlite3 from 'better-sqlite3'

async function main() {
  const wk = sqlite3(`../api-v2/cache/wanikani.db`)
  const re = /[\p{sc=Han}\p{sc=Katakana}\p{sc=Hiragana}]/u

  await initKuromoji()
  await mongoConnect()

  const items = wk
    .prepare(
      /* sql */ `
    SELECT
      vocab, [level],
      json_extract(val, '$.ja') ja,
      json_extract(val, '$.en') en
    FROM (
      SELECT
        json_each.value val,
        json_extract([data], '$.level') [level],
        json_extract([data], '$.characters') vocab
      FROM subjects, json_each(json_extract([data], '$.context_sentences'))
    )
    WHERE val IS NOT NULL
    `
    )
    .all()
    .filter((it) => {
      if (!it.ja) {
        console.log(it)
      }

      return it.ja
    })

  const chunkSize = 1000
  for (let i = 0; i < items.length; i += chunkSize) {
    console.log(i)
    await EntryModel.insertMany(
      items.slice(i, i + chunkSize).map((it) => {
        const segments = [
          it.vocab,
          ...kuromoji
            .tokenize(it.ja)
            .map((t) => t.basic_form || t.surface_form)
            .filter((s) => re.test(s)),
        ].filter((a, i, r) => r.indexOf(a) === i)

        return {
          entry: [it.ja],
          segments,
          english: [it.en],
          vocab: it.vocab,
          level: it.level,
          type: 'sentence',
          source: 'wanikani',
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
