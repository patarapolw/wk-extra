import fs from 'fs'

import yaml from 'js-yaml'

async function main() {
  const FILENAME = 'cache/vocab.yaml'

  const vs = yaml.safeLoad(fs.readFileSync(FILENAME, 'utf8'))

  fs.writeFileSync(
    FILENAME,
    yaml.safeDump(vs, {
      flowLevel: 2,
    })
  )
}

if (require.main === module) {
  main()
}
