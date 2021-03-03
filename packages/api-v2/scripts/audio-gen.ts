import fs from 'fs'

import sqlite3 from 'better-sqlite3'
import sanitize from 'sanitize-filename'
import say from 'say'

async function main() {
  const input = sqlite3('cache/wanikani.db', { readonly: true })

  if (!fs.existsSync('cache/wk-audio-gen')) {
    fs.mkdirSync('cache/wk-audio-gen')
  }
  const output = sqlite3('cache/wk-audio-gen/_list.db')

  output.exec(/* sql */ `
  CREATE TABLE IF NOT EXISTS [audio] (
    [text]      TEXT PRIMARY KEY NOT NULL,
    [filename]  TEXT UNIQUE NOT NULL
  );
  `)

  let promises: Promise<any>[] = []

  const stmt = output.prepare(/* sql */ `
  INSERT INTO [audio] ([text], [filename])
  VALUES (@text, @filename)
  `)

  for (let level = 1; level <= 60; level++) {
    const items = input
      .prepare(
        /* sql */ `
    SELECT
      json_extract([data], '$.characters') japanese,
      json_extract([data], '$.pronunciation_audios[0].url') audio,
      json_extract([data], '$.context_sentences') sentences_json
    FROM subjects
    WHERE [object] = 'vocabulary' AND json_extract([data], '$.level') = @level
    `
      )
      .all({ level })

    for (const it of items) {
      if (promises.length >= 500) {
        console.log(level)
        await Promise.all(promises)
        promises = []
      }

      if (!it.audio) {
        promises.push(insert(stmt, it.japanese))
      }

      if (it.sentences_json) {
        promises.push(
          ...JSON.parse(it.sentences_json)
            .map((s: any) => {
              return s.ja ? insert(stmt, s.ja.replace(/\s+/g, ' ')) : null
            })
            .filter((s: any) => s)
        )
      }
    }
  }

  await Promise.all(promises)

  fs.writeFileSync(
    'cache/wk-audio-gen/_list.tsv',
    'text\tfilename\n' +
      output
        .prepare(
          /* sql */ `
  SELECT [text], [filename] FROM [audio]
  `
        )
        .all()
        .map((s) => s.text + '\t' + s.filename)
        .join('\n') +
      '\n'
  )

  input.close()
  output.close()
}

async function insert(stmt: sqlite3.Statement, ja: string) {
  const filename = `${sanitize(ja)}.wav`

  await new Promise<void>((resolve, reject) => {
    say.export(ja, 'kyoko', 1, `cache/wk-audio-gen/${filename}`, (e) =>
      e ? reject(e) : resolve()
    )
  })

  stmt.run({
    text: ja,
    filename,
  })
}

if (require.main === module) {
  main()
}
