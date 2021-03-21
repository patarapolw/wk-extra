import { EntryModel, RadicalModel } from '@/db/mongo'
import { isHan } from '@/db/util'
import { FastifyPluginAsync } from 'fastify'
import S from 'jsonschema-definer'

const characterRouter: FastifyPluginAsync = async (f) => {
  {
    const sQuery = S.shape({
      entry: S.string(),
    })

    const sResult = S.shape({
      sub: S.list(S.string()),
      sup: S.list(S.string()),
      var: S.list(S.string()),
    })

    f.get<{
      Querystring: typeof sQuery.type
    }>(
      '/radical',
      {
        schema: {
          operationId: 'characterRadical',
          querystring: sQuery.valueOf(),
          response: {
            200: sResult.valueOf(),
          },
        },
      },
      async (req): Promise<typeof sResult.type> => {
        const { entry } = req.query

        const userId: string = req.session.get('userId')
        if (!userId) {
          throw { statusCode: 401 }
        }

        const rad = await RadicalModel.findOne({ entry })

        return {
          sub: rad?.sub || [],
          sup: rad?.sup || [],
          var: rad?.var || [],
        }
      }
    )
  }

  {
    const sQuery = S.shape({
      entry: S.string(),
      limit: S.integer().optional(),
    })

    const sResult = S.shape({
      result: S.list(
        S.shape({
          entry: S.string(),
        })
      ),
    })

    f.get<{
      Querystring: typeof sQuery.type
    }>(
      '/vocabulary',
      {
        schema: {
          operationId: 'characterVocabulary',
          querystring: sQuery.valueOf(),
          response: {
            200: sResult.valueOf(),
          },
        },
      },
      async (req): Promise<typeof sResult.type> => {
        const { entry, limit = 5 } = req.query

        const userId: string = req.session.get('userId')
        if (!userId) {
          throw { statusCode: 401 }
        }

        if (!isHan(entry)) {
          throw { statusCode: 400, message: 'not Character' }
        }

        const fThreshold = 1

        const r = await EntryModel.aggregate([
          {
            $match: {
              $and: [
                {
                  type: 'vocabulary',
                  entry: new RegExp(entry),
                },
                {
                  $or: [
                    { userId },
                    { sharedId: userId },
                    { userId: { $exists: false } },
                  ],
                },
              ],
            },
          },
          { $unwind: '$english' },
          { $unwind: '$entry' },
          {
            $group: {
              _id: '$entry',
              frequency: { $max: '$frequency' },
            },
          },
          { $addFields: { _sort: { $rand: {} } } },
          { $sort: { _sort: 1 } },
          {
            $facet: {
              f1: [
                { $match: { frequency: { $gte: fThreshold } } },
                { $limit: limit },
              ],
              f0: [
                { $match: { frequency: { $lt: fThreshold } } },
                { $limit: limit },
              ],
            },
          },
        ])

        if (!r[0]) {
          return { result: [] }
        }

        return {
          result: [...r[0].f1, ...r[0].f0]
            .slice(0, limit)
            .map((r) => ({ entry: r._id })),
        }
      }
    )
  }

  {
    const sQuery = S.shape({
      entry: S.string(),
      limit: S.integer().optional(),
    })

    const sResult = S.shape({
      result: S.list(
        S.shape({
          entry: S.string(),
          english: S.string(),
        })
      ),
    })

    f.get<{
      Querystring: typeof sQuery.type
    }>(
      '/sentence',
      {
        schema: {
          operationId: 'characterSentence',
          querystring: sQuery.valueOf(),
          response: {
            200: sResult.valueOf(),
          },
        },
      },
      async (req): Promise<typeof sResult.type> => {
        const { entry, limit = 5 } = req.query

        const userId: string = req.session.get('userId')
        if (!userId) {
          throw { statusCode: 401 }
        }

        if (!isHan(entry)) {
          throw { statusCode: 400, message: 'not Character' }
        }

        const result = await EntryModel.aggregate([
          {
            $match: {
              $and: [
                { type: 'sentence', entry: new RegExp(entry) },
                {
                  $or: [
                    { userId },
                    { sharedId: userId },
                    { userId: { $exists: false } },
                  ],
                },
              ],
            },
          },
          { $sort: { userId: -1 } }, // Has UserID first
          { $unwind: '$english' },
          { $unwind: '$entry' },
          {
            $group: {
              _id: '$entry',
              english: { $addToSet: '$english' },
            },
          },
          { $addFields: { _sort: { $rand: {} } } },
          { $sort: { _sort: 1 } },
          { $limit: limit },
        ])

        return {
          result: result.map((r) => ({
            entry: r._id,
            english: r.english[0],
          })),
        }
      }
    )
  }
}

export default characterRouter
