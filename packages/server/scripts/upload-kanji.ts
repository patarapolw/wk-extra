import fs from 'fs'

import mongoose from 'mongoose'
import yaml from 'js-yaml'

import { WkKanjiModel } from '../src/db/mongo'

async function main () {
  await mongoose.connect(process.env.MONGO_URI!, {
    useCreateIndex: true,
    useFindAndModify: false,
    useNewUrlParser: true,
    useUnifiedTopology: true
  })

  const kanjiSrc = yaml.safeLoad(fs.readFileSync('resources/kanji.yaml', 'utf8')) as {
    level: number
    characters: string
    slug: string
  }[]

  for (const vs of chunks(kanjiSrc.map((v) => ({
    _id: v.slug,
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
