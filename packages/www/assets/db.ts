import Loki from 'lokijs'

import { api } from './api'
import { sample } from './util'

export const db = new Loki('wk-extra', {
  autoload: true,
})

export interface ISentence {
  ja: string
  en: string
  words: string[]
}

export const dbSentence = db.addCollection<ISentence>('sentence', {
  indices: ['ja', 'words'],
  unique: ['ja'],
})

const findSentenceQueue = new Map<string, ISentence[]>()

export function findSentenceSync(q: string, generate: number): ISentence[] {
  let prev = findSentenceQueue.get(q)

  prev =
    prev ||
    sample(
      dbSentence.find({
        words: { $contains: q },
      }),
      generate
    )
  findSentenceQueue.set(q, prev)

  return prev
}

export async function findSentence(
  q: string,
  generate: number
): Promise<ISentence[] | null> {
  const prev = findSentenceQueue.get(q)

  if (prev) {
    if (prev.length) {
      return prev
    }

    return null
  }
  findSentenceQueue.set(q, [])

  const r = await api.sentenceQuery({ q, limit: generate })

  const oldSentence: string[] = []
  dbSentence.findAndUpdate({ words: { $contains: q } }, (obj) => {
    oldSentence.push(obj.ja)
    obj.words = [...new Set([...obj.words, q])]
  })

  const sentences = r.data.result
    .filter((s) => {
      return !oldSentence.includes(s.ja)
    })
    .map((s) => ({
      ja: s.ja,
      en: s.en,
      words: [q],
    }))

  if (sentences.length) {
    dbSentence.insert(sentences)

    findSentenceQueue.delete(q)
    return findSentenceSync(q, generate)
  }

  return null
}
