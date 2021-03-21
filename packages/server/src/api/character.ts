import { EntryModel, RadicalModel } from '@/db/mongo'
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
      page: S.integer().optional(),
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
        const { entry, page, limit = 5 } = req.query

        const userId: string = req.session.get('userId')
        if (!userId) {
          throw { statusCode: 401 }
        }

        const result = await EntryModel.aggregate([
          {
            $match: {
              $and: [
                { entry: new RegExp(entry), type: 'sentence' },
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
          ...(page
            ? [{ $skip: (page - 1) * limit }]
            : [
                { $addFields: { _sort: { $rand: {} } } },
                { $sort: { _sort: 1 } },
              ]),
          { $limit: limit },
          {
            $project: {
              _id: 0,
              entry: { $first: '$entry' },
              english: { $first: '$english' },
            },
          },
        ])

        return {
          result,
        }
      }
    )
  }
}

export default characterRouter
