import S, { BaseSchema } from 'jsonschema-definer'
import Loki, { Collection } from 'lokijs'

export let db: Loki

export const sCedict = S.shape({
  entry: S.string(),
  alt: S.list(S.string()).optional(),
  reading: S.list(S.string()).minItems(1),
  english: S.list(S.string()).minItems(1),
})

export let dbCedict: Collection<typeof sCedict.type>

export const sEdict = S.shape({
  entry: S.string().optional(),
  alt: S.list(S.string()),
  reading: S.list(S.string()),
  english: S.list(S.string()),
})

export let dbEdict: Collection<typeof sEdict.type>

export async function dbInit(filename = 'cache/db.loki') {
  return new Promise<void>((resolve) => {
    db = new Loki(filename, {
      autoload: true,
      autoloadCallback: async () => {
        dbCedict = db.getCollection('cedict')
        if (!dbCedict) {
          dbCedict = db.addCollection('cedict', {
            indices: ['entry', 'alt'],
          })
        }

        dbEdict = db.getCollection('edict')
        if (!dbEdict) {
          dbEdict = db.addCollection('edict', {
            indices: ['entry', 'alt'],
          })
        }

        resolve()
      },
    })
  })
}

export function ensureSchema<T extends BaseSchema>(
  schema: T,
  data: T['type']
): T['type'] {
  const [, err] = schema.validate(data)
  if (err) {
    throw new Error((err[0] || {}).message)
  }

  return data as any
}
