import fs from 'fs'

import yaml from 'js-yaml'
import XRegExp from 'xregexp'

import { dbCedict, dbEdict, dbInit } from '@/dict'

async function main() {
  const ksMap = (yaml.safeLoad(fs.readFileSync('cache/kanji.yaml', 'utf8')) as {
    level: number
    kanji: string
  }[]).reduce((prev, { level, kanji }) => {
    prev.set(level, kanji.split(''))
    return prev
  }, new Map<number, string[]>())

  const vsMap = (yaml.safeLoad(fs.readFileSync('cache/vocab.yaml', 'utf8')) as {
    level: number
    vocab: string[]
  }[]).reduce((prev, { level, vocab }) => {
    prev.set(level, vocab)
    return prev
  }, new Map<number, string[]>())

  const hskVocab: string[] = []

  const hskHsMap = (yaml.safeLoad(
    fs.readFileSync('../../data/zhlevel.yaml', 'utf8')
  ) as {
    level: number
    hanzi: string
    vocab: string[]
  }[]).reduce((prev, { level, hanzi, vocab }) => {
    hskVocab.push(...vocab)
    prev.set(level, hanzi.split(''))
    return prev
  }, new Map<number, string[]>())

  await dbInit()
  const reChinese = XRegExp('^\\p{Han}+$')
  const accWkHanzi: string[] = []
  const accHskHanzi: string[] = []

  const oldSimilarVocab = new Set<string>()
  const oldWkVocab = new Set<string>()
  const oldHskVocab = new Set<string>()

  const out: {
    level: number
    hanzi: {
      wanikani: string
      zhlevel: string
    }
    vocab: {
      similar: string[]
      'wanikani-based': string[]
      'zhlevel-based': string[]
    }
  }[] = Array.from({ length: 60 }).map((_, i) => {
    const level = i + 1
    accWkHanzi.push(...(ksMap.get(level) || []))
    accHskHanzi.push(...(hskHsMap.get(level) || []))

    const wkVocab = new Set(vsMap.get(level) || [])
    const allWkVocab = new Set(
      Array.from(
        new Set(
          dbEdict
            .where((o) => o.alt.some((a) => wkVocab.has(a)))
            .map(({ alt }) => alt)
            .flat()
        )
      ).filter((a) => reChinese.test(a))
    )

    const similar = new Set(
      dbCedict
        .where(({ entry, alt = [] }) =>
          [entry, ...alt].some((a) => allWkVocab.has(a))
        )
        .map(({ entry }) => entry)
    )

    const wkHanzi = new Set(accWkHanzi)
    const zhHanzi = new Set([...accWkHanzi, ...accHskHanzi])

    const wkBased = new Set(
      dbCedict
        .where(({ entry, alt = [] }) =>
          Array.from(new Set([entry, ...alt].join('').split(''))).every((a) =>
            wkHanzi.has(a)
          )
        )
        .map(({ entry }) => entry)
    )
    const zhBased = new Set(
      dbCedict
        .where(({ entry, alt = [] }) =>
          Array.from(new Set([entry, ...alt].join('').split(''))).every((a) =>
            zhHanzi.has(a)
          )
        )
        .map(({ entry }) => entry)
    )

    return {
      level,
      hanzi: {
        wanikani: (ksMap.get(level) || []).join(''),
        zhlevel: (hskHsMap.get(level) || []).join(''),
      },
      vocab: {
        similar: hskVocab
          .filter((v) => !oldSimilarVocab.has(v))
          .filter((v) => similar.has(v))
          .map((v) => {
            oldSimilarVocab.add(v)
            return v
          }),
        'wanikani-based': hskVocab
          .filter((v) => !oldWkVocab.has(v))
          .filter((v) => wkBased.has(v))
          .map((v) => {
            oldWkVocab.add(v)
            return v
          }),
        'zhlevel-based': hskVocab
          .filter((v) => !oldHskVocab.has(v))
          .filter((v) => zhBased.has(v))
          .map((v) => {
            oldHskVocab.add(v)
            return v
          }),
      },
    }
  })

  fs.writeFileSync(
    'cache/zhvocab.yaml',
    yaml.safeDump(out, {
      flowLevel: 3,
    })
  )
}

if (require.main === module) {
  main()
}
