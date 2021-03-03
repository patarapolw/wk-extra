import fs from 'fs'

import sqlite3 from 'better-sqlite3'

async function main() {
  const input = sqlite3('cache/wanikani.db', { readonly: true })

  const out: string[] = []

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

    out.push(
      ...items.map((it) => {
        return JSON.parse(it.sentences_json)
          .map((s: any) => {
            if (!s.ja) {
              return ''
            }

            return [
              s.ja.replace(/\s+/g, ' '),
              s.en.replace(/\s+/g, ' '),
              level.toString(),
              ['wanikani', `level${level.toString().padStart(2, '0')}`].join(
                ' '
              ),
            ].join('\t')
          })
          .filter((s: string) => s)
          .join('\n')
      })
    )
  }

  fs.writeFileSync('cache/wk-audio-gen.tsv', out.join('\n'))

  input.close()
}

if (require.main === module) {
  main()
}
