import mongoose from 'mongoose'
import { getLearnt } from './wk/get'
import { WkKanjiModel, WkVocabModel, WkSentenceModel } from '../src/db/mongo'

async function main () {
  await mongoose.connect(process.env.MONGO_URI!, {
    useCreateIndex: true,
    useFindAndModify: false,
    useNewUrlParser: true,
    useUnifiedTopology: true
  })

  const learnt = await getLearnt()

  const [rKanji, rVocab, rSentence] = await Promise.all([
    WkKanjiModel.aggregate([
      { $match: { _id: { $in: learnt.map((ls) => ls.id) } } },
      { $sample: { size: 5 } },
      { $project: { entry: 1, _id: 0 } }
    ]),
    WkVocabModel.aggregate([
      { $match: { _id: { $in: learnt.map((ls) => ls.id) } } },
      { $sample: { size: 5 } },
      { $project: { entry: 1, _id: 0 } }
    ]),
    WkSentenceModel.aggregate([
      { $match: { vocab: { $in: learnt.map((ls) => ls.id) } } },
      { $sample: { size: 5 } },
      { $project: { entry: '$ja', _id: 0 } }
    ])
  ])

  console.log(rKanji, rVocab, rSentence)

  mongoose.disconnect()
}

if (require.main === module) {
  main()
}
