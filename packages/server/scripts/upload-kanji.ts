import { getKanji } from './wk/get'
import { wkDb } from '../src/db/local'

async function main () {
  const insertKanji = wkDb.prepare(/*sql*/`
  INSERT INTO kanji (id, [entry], [level])
  VALUES (@id, @entry, @level)
  `)

  const insertManyKanji = wkDb.transaction((rs: any[]) => {
    for (const r of rs) {
      insertKanji.run(r)
    }
  })

  const kanjiSrc = await getKanji()

  for (const vs of chunks(kanjiSrc.map((v) => ({
    id: v.id,
    entry: v.characters,
    level: v.level
  })), 1000)) {
    insertManyKanji(vs)
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
