import { FastifyInstance } from 'fastify'
import S from 'jsonschema-definer'

import { reHan1, zhDict, zhToken } from '@/db/local'
import { DbExtraModel, sDbExtraExport } from '@/db/mongo'
import { sDictType, sId } from '@/util/schema'

export default (f: FastifyInstance, _: any, next: () => void) => {
  doCreate()
  doUpdate()
  doDelete()

  next()

  function doCreate() {
    const sBody = S.shape({
      entry: S.string(),
      reading: S.string(),
      english: S.string(),
      lang: S.string().enum('jp', 'zh'),
    })

    const sResponse = S.shape({
      existing: S.shape({
        source: S.anyOf(sDictType, S.string().enum('hanzi')),
        entry: S.string(),
      }).optional(),
      _id: sId.optional(),
    })

    f.put<{
      Body: typeof sBody.type
    }>(
      '/',
      {
        schema: {
          body: sBody.valueOf(),
          response: {
            200: sResponse.valueOf(),
          },
        },
      },
      async (req, reply): Promise<typeof sResponse.type> => {
        const userId = req.session.get('userId')
        if (!userId) {
          reply.status(401)
          return {}
        }

        const { entry, reading, english, lang } = req.body

        if (lang === 'zh') {
          const existing = zhDict.cedict.findOne({
            $or: [{ entry }, { alt: { $in: entry } }],
          })
          if (existing) {
            return {
              existing: {
                source: 'cedict',
                entry: existing.entry,
              },
            }
          }
        }

        {
          const existing = zhDict.edict.findOne({ alt: { $in: entry } })
          if (existing) {
            return {
              existing: {
                source: 'edict',
                entry: existing.entry,
              },
            }
          }
        }

        if (reHan1.test(entry)) {
          const existing = zhToken.findOne({
            entry,
          })
          if (existing) {
            return {
              existing: {
                source: 'hanzi',
                entry,
              },
            }
          }
        } else {
          const existing = zhDict.tatoeba.findOne({
            entry,
          })
          if (existing) {
            return {
              existing: {
                source: 'tatoeba',
                entry,
              },
            }
          }
        }

        const extra = await DbExtraModel.create({
          userId,
          entry,
          reading,
          english,
          lang,
        })

        return {
          _id: extra._id,
        }
      }
    )
  }

  function doUpdate() {
    const sBody = S.shape({
      id: S.anyOf(sId, S.list(sId).minItems(1)),
      set: sDbExtraExport,
    })

    f.patch<{
      Body: typeof sBody.type
    }>(
      '/',
      {
        schema: {
          body: {
            type: 'object',
            required: ['ids', 'set'],
            properties: {
              ids: { type: 'array', items: { type: 'string' } },
              set: { type: 'object' },
            },
          },
        },
      },
      async (
        req,
        reply
      ): Promise<{
        error?: string
      }> => {
        const userId = req.session.get('userId')
        if (!userId) {
          reply.status(401)
          return {}
        }

        const { id, set } = req.body

        await DbExtraModel.updateMany(
          { _id: { $in: Array.isArray(id) ? id : [id] } },
          {
            $set: set,
          }
        )

        reply.status(201)
        return {}
      }
    )
  }

  function doDelete() {
    const sQuery = S.shape({
      id: sId,
    })

    f.delete<{
      Querystring: typeof sQuery.type
    }>(
      '/',
      {
        schema: {
          querystring: sQuery.valueOf(),
        },
      },
      async (
        req,
        reply
      ): Promise<{
        error?: string
      }> => {
        const userId = req.session.get('userId')
        if (!userId) {
          reply.status(401)
          return {}
        }

        const { id } = req.query

        await DbExtraModel.purgeMany(userId, {
          _id: id,
        })

        reply.status(201)
        return {}
      }
    )
  }
}
