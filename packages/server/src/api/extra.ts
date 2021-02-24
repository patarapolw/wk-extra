import { ExtraModel } from '@/db/mongo'
import { QSplit } from '@/db/token'
import { FastifyPluginAsync } from 'fastify'
import hepburn from 'hepburn'
import S from 'jsonschema-definer'

const extraRouter: FastifyPluginAsync = async (f) => {
  {
    const sQuery = S.shape({
      q: S.string(),
      page: S.integer().optional(),
      limit: S.integer().optional(),
    })

    const sResult = S.shape({
      result: S.list(
        S.shape({
          entry: S.list(S.string()),
          reading: S.list(
            S.shape({
              type: S.string().optional(),
              kana: S.string(),
            })
          ),
          english: S.list(S.string()),
        })
      ),
    })

    const makeJa = new QSplit({
      default: (v) => {
        return {
          $or: [
            { entry: v },
            { 'reading.kana': hepburn.toHiragana(hepburn.fromKana(v)) },
            { $text: { $search: v } },
          ],
        }
      },
      fields: {
        entry: { ':': (v) => ({ entry: v }) },
        onyomi: {
          ':': (v) => ({
            reading: {
              type: 'onyomi',
              kana: hepburn.toHiragana(hepburn.fromKana(v)),
            },
          }),
        },
        kunyomi: {
          ':': (v) => ({
            reading: {
              type: 'kunyomi',
              kana: hepburn.toHiragana(hepburn.fromKana(v)),
            },
          }),
        },
        nanori: {
          ':': (v) => ({
            reading: {
              type: 'nanori',
              kana: hepburn.toHiragana(hepburn.fromKana(v)),
            },
          }),
        },
        reading: {
          ':': (v) => ({ 'reading.kana': v }),
        },
        english: { ':': (v) => ({ $text: { $search: v } }) },
      },
    })

    f.get<{
      Querystring: typeof sQuery.type
    }>(
      '/q',
      {
        schema: {
          querystring: sQuery.valueOf(),
          response: {
            200: sResult.valueOf(),
          },
        },
      },
      async (req): Promise<typeof sResult.type> => {
        const { q, page = 1, limit = 10 } = req.query

        const userId: string = req.session.get('userId')
        if (!userId) {
          throw { statusCode: 401 }
        }

        const dCond = makeJa.parse(q)

        const rs = await ExtraModel.find({
          $and: [dCond || {}, { $or: [{ userId }, { sharedId: userId }] }],
        })
          .sort('-updatedAt')
          .skip((page - 1) * limit)
          .limit(limit)
          .select({
            _id: 0,
            entry: 1,
            reading: 1,
            english: 1,
          })

        return {
          result: rs,
        }
      }
    )
  }
}

export default extraRouter
