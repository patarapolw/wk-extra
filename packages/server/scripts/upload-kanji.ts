import mongoose from 'mongoose'

import { WkKanjiModel } from '../src/db/mongo'
import { getKanji } from './wk/get'

async function main () {
  await mongoose.connect(process.env.MONGO_URI!, {
    useCreateIndex: true,
    useFindAndModify: false,
    useNewUrlParser: true,
    useUnifiedTopology: true
  })

  const kanjiSrc = await getKanji()

  for (const vs of chunks(kanjiSrc.map((v) => ({
    _id: v.id,
    entry: v.characters,
    level: v.level
  })), 1000)) {
    await WkKanjiModel.insertMany(vs)
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
