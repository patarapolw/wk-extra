import fs from 'fs'

import yaml from 'js-yaml'

import { getVocab } from '@/wk/get'

async function main() {
  const ssMap = new Map<
    string,
    { level: number; wkVocab: string | string[]; en: string }
  >()

  const vs = Array.from(
    (await getVocab()).reduce((prev, { level, characters, sentences }) => {
      const set = prev.get(level) || new Set()
      set.add(characters)
      prev.set(level, set)

      sentences.map(({ en, ja }) => {
        if (ssMap.has(ja)) {
          console.log(
            `Duplicated sentence: ${ja} at ${JSON.stringify({
              level,
              characters,
            })}`
          )

          const { level: _level, wkVocab: _wkVocab, en } = ssMap.get(ja)!
          const wkVocab = Array.isArray(_wkVocab) ? _wkVocab : [_wkVocab]
          wkVocab.push(characters)

          ssMap.set(ja, {
            level: level < _level ? level : _level,
            wkVocab,
            en,
          })
        } else {
          ssMap.set(ja, {
            level,
            wkVocab: characters,
            en,
          })
        }
      })

      return prev
    }, new Map<number, Set<string>>())
  )
    .sort(([lv1], [lv2]) => lv1 - lv2)
    .map(([level, set]) => ({ level, vocab: Array.from(set) }))

  fs.writeFileSync(
    'cache/vocab.yaml',
    yaml.safeDump(vs, {
      flowLevel: 2,
    })
  )

  const ss = Array.from(
    Array.from(ssMap).reduce(
      (prev, [ja, { level, wkVocab, en }]) => {
        const data = prev.get(level) || []
        data.push({ ja, en, wkVocab })
        prev.set(level, data)

        return prev
      },
      new Map<
        number,
        {
          ja: string
          en: string
          wkVocab: string | string[]
        }[]
      >()
    )
  )
    .sort(([lv1], [lv2]) => lv1 - lv2)
    .map(([level, sentences]) => ({ level, sentences }))

  fs.writeFileSync('cache/sentences.yaml', yaml.safeDump(ss))
}

if (require.main === module) {
  main()
}
