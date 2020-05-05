import mongoose from 'mongoose'

import { WkSentenceModel, WkVocabModel } from '../src/db/mongo'
import { getVocab } from './wk/get'

async function main () {
  await mongoose.connect(process.env.MONGO_URI!, {
    useCreateIndex: true,
    useFindAndModify: false,
    useNewUrlParser: true,
    useUnifiedTopology: true
  })

  const vocabSrc = await getVocab()

  const sentences = new Map<string, {
    en: string
    ja: string
    vocab: number[]
  }>()

  vocabSrc.map((v) => {
    v.sentences.map((s) => {
      const ss = sentences.get(s.ja)
      if (ss) {
        ss.vocab.push(v.id)
        sentences.set(s.ja, ss)
      } else {
        sentences.set(s.ja, {
          ...s,
          vocab: [v.id]
        })
      }
    })
  })

  for (const ss of chunks(Array.from(sentences).map(([_, el]) => el), 1000)) {
    await WkSentenceModel.insertMany(ss)
  }

  for (const vs of chunks(vocabSrc.map((v) => ({
    _id: v.id,
    entry: v.characters,
    level: v.level
  })), 1000)) {
    await WkVocabModel.insertMany(vs)
  }

  mongoose.disconnect()
}

function * chunks<T> (arr: T[], n: number) {
  for (let i = 0; i < arr.length; i += n) {
    yield arr.slice(i, i + n)
  }
}

if (require.main === module) {
  main()
}
