import fs from 'fs'

import yaml from 'js-yaml'

import { getKanji } from '@/wk/get'

async function main() {
  const ks = Array.from(
    (await getKanji()).reduce((prev, { level, characters }) => {
      const ss = prev.get(level) || new Set()
      ss.add(characters)
      prev.set(level, ss)

      return prev
    }, new Map<number, Set<string>>())
  )
    .sort(([lv1], [lv2]) => lv1 - lv2)
    .map(([level, ss]) => ({ level, kanji: Array.from(ss).join('') }))

  fs.writeFileSync('cache/kanji.yaml', yaml.safeDump(ks))
}

if (require.main === module) {
  main()
}
