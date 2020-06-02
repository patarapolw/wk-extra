import mongoose from 'mongoose'
import { getLearnt } from './wk/get'
import { wkDb } from '../src/db/local'

async function main () {
  const learnt = (await getLearnt()).map((ln) => ln.id)

  const rKanji = wkDb.prepare(/*sql*/`
  SELECT [entry] FROM kanji
  WHERE id IN (${Array(learnt.length).fill('?').join(',')})
  ORDER BY RANDOM() LIMIT 5
  `).all(learnt)

  const rVocab = wkDb.prepare(/*sql*/`
  SELECT [entry] FROM vocab
  WHERE id IN (${Array(learnt.length).fill('?').join(',')})
  ORDER BY RANDOM() LIMIT 5
  `).all(learnt)

  const rSentence = wkDb.prepare(/*sql*/`
  SELECT ja FROM sentence
  WHERE vocab_id IN (${Array(learnt.length).fill('?').join(',')})
  ORDER BY RANDOM() LIMIT 5
  `).all(learnt)

  console.log(rKanji, rVocab, rSentence)

  mongoose.disconnect()
}

if (require.main === module) {
  main()
}
