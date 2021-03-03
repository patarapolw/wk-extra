import { ICollection, IResource, wkApi } from '@/wk/wanikani'
import sqlite3 from 'better-sqlite3'

async function main() {
  const db = sqlite3('cache/wanikani.db')

  let nextUrl = '/subjects'

  db.exec(/* sql */ `
  CREATE TABLE [subjects] (
    id          INT PRIMARY KEY NOT NULL,
    updated_at  TIMESTAMP NOT NULL,
    [object]    TEXT NOT NULL,
    [url]       TEXT NOT NULL,
    [data]      JSON NOT NULL
  );

  CREATE INDEX idx_subjects_object ON [subjects] ([object]);
  `)

  const stmt = db.prepare(/* sql */ `
  INSERT INTO [subjects] (id, updated_at, [object], [url], [data])
  VALUES (@id, @updatedAt, @object, @url, @data)
  `)

  while (true) {
    const r = await wkApi.get<
      ICollection<
        IResource<any> & {
          id: number
          object: string
          data_updated_at: string
          url: string
        }
      >
    >(nextUrl)

    db.transaction(() => {
      for (const d of r.data.data) {
        stmt.run({
          id: d.id,
          updatedAt: d.data_updated_at,
          object: d.object,
          url: d.url,
          data: JSON.stringify(d.data),
        })
      }
    })()

    console.log(r.data.url)

    nextUrl = r.data.pages.next_url || ''
    if (!nextUrl) {
      break
    }
  }

  db.close()
}

if (require.main === module) {
  main().catch(console.error)
}
