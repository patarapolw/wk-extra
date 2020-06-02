import { getVocab } from './wk/get'
import { wkDbInit, wkDb } from '../src/db/local'

async function main () {
  wkDbInit()

  const vocabSrc = await getVocab()

  const sentences = new Map<string, {
    en: string
    ja: string
    vocab_id: number
  }>()

  vocabSrc.map((v) => {
    v.sentences.map((s) => {
      sentences.set(s.ja, {
        ...s,
        vocab_id: v.id
      })
    })
  })

  const insertVocab = wkDb.prepare(/*sql*/`
  INSERT INTO vocab (id, [entry], [level])
  VALUES (@id, @entry, @level)
  `)

  const insertManyVocab = wkDb.transaction((rs: any[]) => {
    for (const r of rs) {
      insertVocab.run(r)
    }
  })

  for (const vs of chunks(vocabSrc.map((v) => ({
    id: v.id,
    entry: v.characters,
    level: v.level
  })), 1000)) {
    insertManyVocab(vs)
  }

  const insertSentence = wkDb.prepare(/*sql*/`
  INSERT INTO sentence (ja, en, vocab_id)
  VALUES (@ja, @en, @vocab_id)
  `)

  const insertManySentence = wkDb.transaction((rs: any[]) => {
    for (const r of rs) {
      insertSentence.run(r)
    }
  })

  for (const ss of chunks(Array.from(sentences).map(([_, el]) => el), 1000)) {
    insertManySentence(ss)
  }
}

function * chunks<T> (arr: T[], n: number) {
  for (let i = 0; i < arr.length; i += n) {
    yield arr.slice(i, i + n)
  }
}

if (require.main === module) {
  main()
}
