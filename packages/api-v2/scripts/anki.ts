import { spawnSync } from 'child_process'

import axios from 'axios'
import sqlite3 from 'better-sqlite3'
import sanitize from 'sanitize-filename'

async function main() {
  const db = sqlite3('cache/wanikani.db')
  const audioDB = sqlite3('cache/wk-audio/_list.db')

  const getAudio = (ja: string) => {
    const r = audioDB
      .prepare(
        /* sql */ `
    SELECT [filename] FROM [audio] WHERE [text] = @text
    `
      )
      .get({ text: ja })
    if (r) {
      return r.filename
    }

    console.log(ja)

    const filename = `${sanitize(ja)}.mp3`
    spawnSync('say', ['-v', 'kyoko', '-o', `cache/wk-audio/${filename}`, ja])

    audioDB
      .prepare(
        /* sql */ `
    INSERT INTO [audio] ([filename], [text]) VALUES (@filename, @text)
    `
      )
      .run({ text: ja, filename })

    return filename
  }

  for (let level = 1; level <= 10; level++) {
    const items = db
      .prepare(
        /* sql */ `
    SELECT
      json_extract([data], '$.characters') japanese,
      json_extract([data], '$.meanings') meanings_json,
      json_extract([data], '$.readings') readings_json,
      json_extract([data], '$.context_sentences') sentences_json
    FROM subjects
    WHERE [object] = 'vocabulary' AND json_extract([data], '$.level') = @level
    `
      )
      .all({ level })

    const { data } = await axios.post('http://localhost:8765', {
      action: 'addNotes',
      version: 6,
      params: {
        notes: items.map((it) => {
          return {
            deckName: `wanikani::01-10 快 PLEASANT`,
            modelName: 'wanikani_vocab',
            fields: {
              japanese: it.japanese,
              english: JSON.parse(it.meanings_json)
                .map((m: any) => m.meaning)
                .join(' / '),
              level: level.toString(),
              kana: JSON.parse(it.readings_json)
                .map((m: any) => m.reading)
                .join(' / '),
              sentences:
                `<ul>\n` +
                JSON.parse(it.sentences_json)
                  .map((s: any) =>
                    [
                      `<li>${s.ja} [sound:${getAudio(s.ja)}]`,
                      `<ul>`,
                      `<li>${s.en}</li>`,
                      `</ul>`,
                      `</li>`,
                    ].join('\n')
                  )
                  .join('\n') +
                '\n</ul>',
              pronunciation: `[sound:${getAudio(it.japanese)}]`,
            },
            tags: ['wanikani', `level${level.toString().padStart(2, '0')}`],
          }
        }),
      },
    })

    console.log(data)
  }

  db.close()
}

if (require.main === module) {
  main()
}
