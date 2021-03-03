import fs from 'fs'
import path from 'path'

// import axios from 'axios'
import sqlite3 from 'better-sqlite3'

async function main() {
  const input = sqlite3('cache/wanikani.db', { readonly: true })

  const audioPath = (...ps: string[]) => path.join('cache/wk-audio', ...ps)

  if (!fs.existsSync(audioPath())) {
    fs.mkdirSync(audioPath())
  }
  const output = sqlite3(audioPath('_list.db'))

  // output.exec(/* sql */ `
  // CREATE TABLE [audio] (
  //   [text]      TEXT PRIMARY KEY NOT NULL,
  //   [filename]  TEXT UNIQUE NOT NULL
  // );
  // `)

  // let promises: Promise<any>[] = []

  // const stmt = output.prepare(/* sql */ `
  // INSERT INTO [audio] ([text], [filename])
  // VALUES (@text, @filename)
  // `)

  // for (let level = 1; level <= 60; level++) {
  //   const items = input
  //     .prepare(
  //       /* sql */ `
  //   SELECT
  //   json_extract([data], '$.level') [level],
  //     json_extract([data], '$.characters') japanese,
  //     json_extract([data], '$.pronunciation_audios[0].url') audio,
  //     json_extract([data], '$.context_sentences') sentences_json
  //   FROM subjects
  //   WHERE [object] = 'vocabulary' AND json_extract([data], '$.level') = @level
  //   `
  //     )
  //     .all({ level })

  //   for (const it of items) {
  //     if (promises.length >= 50) {
  //       console.log(it.level)
  //       await Promise.all(promises)
  //       promises = []
  //     }

  //     if (it.audio) {
  //       promises.push(
  //         axios.get(it.audio).then((r) => {
  //           let filename = it.audio.split('?')[0]
  //           filename = filename.split('/')
  //           filename = filename[filename.length - 1]
  //           fs.writeFileSync(`cache/wk-audio/${filename}`, r.data)

  //           return insert(stmt, it.japanese, filename)
  //         })
  //       )
  //     }
  //   }
  // }

  // await Promise.all(promises)

  fs.writeFileSync(
    'cache/wk-audio/_list.json',
    JSON.stringify(
      output
        .prepare(
          /* sql */ `
  SELECT [text], [filename] FROM [audio]
  `
        )
        .all()
        .reduce(
          (prev, c) => ({ ...prev, [c.text]: c.filename }),
          {} as Record<string, string>
        ),
      null,
      2
    )
  )

  input.close()
  output.close()
}

if (require.main === module) {
  main()
}
