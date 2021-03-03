import { SentenceModel, mongoConnect } from '@/db/mongo'
import { mongoose } from '@typegoose/typegoose'
import sqlite3 from 'better-sqlite3'
import Mecab from 'mecab-lite'
import XRegExp from 'xregexp'

async function main() {
  const wk = sqlite3(`${__dirname}/wanikani.db`)
  const mecab = new Mecab()
  const re = XRegExp('[\\p{Han}\\p{Katakana}\\p{Hiragana}]')

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
    await SentenceModel.insertMany(
      items.slice(i, i + chunkSize).map((it) => ({
        ja: it.ja,
        word: mecab.wakatigakiSync(it.ja).filter((s) => re.test(s)),
        en: it.en,
        vocab: it.vocab,
        level: it.level,
        source: 'wanikani',
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
