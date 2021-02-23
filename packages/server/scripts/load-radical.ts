import { RadicalModel, mongoConnect } from '@/db/mongo'
import { mongoose } from '@typegoose/typegoose'
import axios from 'axios'
import sqlite3 from 'better-sqlite3'
import XRegExp from 'xregexp'

async function main() {
  const wk = sqlite3('../../data/radical.db')
  const reHan = XRegExp('\\p{Han}', 'g')
  const getHan = (s: string) => {
    reHan.lastIndex = 0
    const out: string[] = []

    let m: RegExpExecArray | null = null
    while ((m = reHan.exec(s))) {
      out.push(m[0] || '')
    }

    return out
  }

  await mongoConnect()

  const items = wk
    .prepare(
      /* sql */ `
    SELECT
      [entry],
      sub, sup, [var]
    FROM radical
    `
    )
    .all()

  const fMap: Record<string, number> = await axios
    .post(
      'http://localhost:8000/wordfreq?lang=ja',
      items.map((it) => it.entry)
    )
    .then((r) => r.data)

  const chunkSize = 10000
  for (let i = 0; i < items.length; i += chunkSize) {
    console.log(i)
    await RadicalModel.insertMany(
      items.slice(i, i + chunkSize).map((it) => {
        return {
          entry: it.entry,
          sub: getHan(it.sub).sort((a, b) => (fMap[b] || 0) - (fMap[a] || 0)),
          sup: getHan(it.sup).sort((a, b) => (fMap[b] || 0) - (fMap[a] || 0)),
          var: getHan(it.var).sort((a, b) => (fMap[b] || 0) - (fMap[a] || 0)),
        }
      })
    )
  }

  wk.close()

  console.log('disconnecting')
  await mongoose.disconnect()
  console.log('disconnected')
}

if (require.main === module) {
  main()
}
