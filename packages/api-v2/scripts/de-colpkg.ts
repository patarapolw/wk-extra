import fs from 'fs'
import path from 'path'

async function main() {
  const sentPath = (...ps: string[]) => path.join('cache/wk-sentence', ...ps)

  Object.entries<string>(
    JSON.parse(fs.readFileSync(sentPath('media'), 'utf-8'))
  ).map(([n, v]) => {
    fs.renameSync(sentPath(n), sentPath(v))
  })

  const lines = fs
    .readFileSync(sentPath('wk-sentence.txt'), 'utf-8')
    .split('\n')
    .map((r) => {
      const rs = r.split('\t')
      const mAudio = /\[sound:(.+)\]/.exec(rs[3])
      if (!mAudio) {
        throw new Error()
      }

      return {
        ja: rs[0],
        audio: mAudio[1],
      }
    })
    .reduce(
      (prev, c) => ({ ...prev, [c.ja]: c.audio }),
      {} as Record<string, string>
    )

  fs.writeFileSync(sentPath('_list.json'), JSON.stringify(lines, null, 2))
}

if (require.main === module) {
  main()
}
