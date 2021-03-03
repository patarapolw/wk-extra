import axios from 'axios'
import sqlite3 from 'better-sqlite3'

async function main() {
  const db = sqlite3('cache/wanikani.db')

  for (let level = 20; level <= 30; level++) {
    const items = db
      .prepare(
        /* sql */ `
    SELECT
      json_extract([data], '$.characters') japanese,
      json_extract([data], '$.meanings') meanings_json,
      json_extract([data], '$.readings') readings_json,
      json_extract([data], '$.pronunciation_audios[0].url') audio,
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
            deckName: `wanikani::11-10 苦 PAINFUL`,
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
                      `<li>${s.ja}`,
                      `<ul>`,
                      `<li>${s.en}</li>`,
                      `</ul>`,
                      `</li>`,
                    ].join('\n')
                  )
                  .join('\n') +
                '\n</ul>',
            },
            tags: [`level${level.toString().padStart(2, '0')}`],
            audio: it.audio
              ? [
                  {
                    url: it.audio,
                    filename: /\/(.+?)(\?[^/]+)?$/.exec(it.audio)![1],
                    fields: ['pronunciation'],
                  },
                ]
              : [],
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
