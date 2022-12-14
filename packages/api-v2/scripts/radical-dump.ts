import { writeFileSync } from 'fs';

import sqlite3 from 'better-sqlite3';
import yaml from 'js-yaml';

async function main() {
  const db = sqlite3('../../data/radical.db', { readonly: true });
  const all = db
    .prepare(
      /* sql */ `
  SELECT "entry", sub, sup, var FROM radical
  `,
    )
    .all()
    .map((d) => {
      for (const [k, v] of Object.entries(d)) {
        if (!v) {
          delete d[k];
        }
      }
      return d;
    });

  writeFileSync('../../data/radical.yaml', yaml.dump(all));
}

if (require.main === module) {
  main();
}
