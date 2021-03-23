import { EntryModel, LibraryModel } from '@/db/mongo'
import { QSplit, qDateUndefined, qNumberUndefined } from '@/db/token'
import { isHan } from '@/db/util'
import { FastifyPluginAsync } from 'fastify'
import { katakanaToHiragana, romajiToHiragana } from 'jskana'
import S from 'jsonschema-definer'

const libraryRouter: FastifyPluginAsync = async (f) => {
  {
    const sQuery = S.shape({
      id: S.string(),
    })

    const sResult = S.shape({
      title: S.string(),
      entries: S.list(S.string()),
      type: S.string(),
      description: S.string(),
      tag: S.list(S.string()),
    })

    f.get<{
      Querystring: typeof sQuery.type
    }>(
      '/id',
      {
        schema: {
          operationId: 'libraryGetOne',
          querystring: sQuery.valueOf(),
          response: {
            200: sResult.valueOf(),
          },
        },
      },
      async (req): Promise<typeof sResult.type> => {
        const { id } = req.query

        const userId: string = req.session.get('userId')
        if (!userId) {
          throw { statusCode: 401 }
        }

        const r = await LibraryModel.findOne({
          _id: id,
          userId,
        })

        if (!r) {
          throw { statusCode: 404 }
        }

        return {
          title: r.title,
          entries: r.entries,
          type: r.type,
          description: r.description,
          tag: r.tag,
        }
      }
    )
  }

  {
    const sResponse = S.shape({
      id: S.string(),
    })

    const sBody = S.shape({
      title: S.string(),
      entries: S.list(S.string()),
      type: S.string(),
      description: S.string(),
      tag: S.list(S.string()),
    })

    f.put<{
      Body: typeof sBody.type
    }>(
      '/',
      {
        schema: {
          operationId: 'libraryCreate',
          body: sBody.valueOf(),
          response: {
            201: sResponse.valueOf(),
          },
        },
      },
      async (req, reply): Promise<typeof sResponse.type> => {
        const { title, entries, type, description, tag } = req.body

        const userId: string = req.session.get('userId')
        if (!userId) {
          throw { statusCode: 401 }
        }

        if (type === 'character' && !entries.every((it) => isHan(it))) {
          throw { statusCode: 400, message: 'not all Kanji' }
        }

        const r = await LibraryModel.create({
          userId,
          title,
          entries,
          type,
          description,
          tag,
        })

        reply.status(201)
        return {
          id: r._id,
        }
      }
    )
  }

  {
    const sQuery = S.shape({
      id: S.string(),
    })

    const sBody = S.shape({
      title: S.string(),
      entries: S.list(S.string()),
      type: S.string(),
      description: S.string(),
      tag: S.list(S.string()),
    })

    const sResponse = S.shape({
      result: S.string(),
    })

    f.patch<{
      Querystring: typeof sQuery.type
      Body: typeof sBody.type
    }>(
      '/',
      {
        schema: {
          operationId: 'libraryUpdate',
          querystring: sQuery.valueOf(),
          body: sBody.valueOf(),
          response: {
            201: sResponse.valueOf(),
          },
        },
      },
      async (req, reply): Promise<typeof sResponse.type> => {
        const { id } = req.query
        const { title, entries, type, description, tag } = req.body

        const userId: string = req.session.get('userId')
        if (!userId) {
          throw { statusCode: 401 }
        }

        if (type === 'character' && !entries.every((it) => isHan(it))) {
          throw { statusCode: 400, message: 'not all Kanji' }
        }

        const r = await LibraryModel.findOneAndUpdate(
          {
            _id: id,
            userId,
          },
          {
            title,
            entries,
            type,
            description,
            tag,
          }
        )

        if (!r) {
          throw { statusCode: 404 }
        }

        reply.status(201)
        return {
          result: 'updated',
        }
      }
    )
  }

  {
    const sQuery = S.shape({
      id: S.string(),
    })

    const sResponse = S.shape({
      result: S.string(),
    })

    f.delete<{
      Querystring: typeof sQuery.type
    }>(
      '/',
      {
        schema: {
          operationId: 'libraryDelete',
          querystring: sQuery.valueOf(),
          response: {
            201: sResponse.valueOf(),
          },
        },
      },
      async (req, reply): Promise<typeof sResponse.type> => {
        const { id } = req.query

        const userId: string = req.session.get('userId')
        if (!userId) {
          throw { statusCode: 401 }
        }

        const r = await LibraryModel.deleteOne({
          userId,
          _id: id,
        })

        if (!r.deletedCount) {
          throw { statusCode: 404 }
        }

        reply.status(201)
        return {
          result: 'deleted',
        }
      }
    )
  }

  {
    const sQuery = S.shape({
      q: S.string(),
      page: S.integer().optional(),
      limit: S.integer().optional(),
    })

    const sResult = S.shape({
      result: S.list(
        S.shape({
          id: S.string(),
          title: S.string(),
          entries: S.list(S.string()),
          type: S.string(),
        })
      ),
    })

    const makeQuiz = new QSplit({
      default: () => ({}),
      fields: {
        srsLevel: qNumberUndefined('srsLevel'),
        nextReview: qDateUndefined('nextReview'),
        lastRight: qDateUndefined('lastRight'),
        lastWrong: qDateUndefined('lastWrong'),
        maxRight: qNumberUndefined('maxRight'),
        maxWrong: qNumberUndefined('maxWrong'),
        rightStreak: qNumberUndefined('rightStreak'),
        wrongStreak: qNumberUndefined('wrongStreak'),
      },
    })

    f.get<{
      Querystring: typeof sQuery.type
    }>(
      '/q',
      {
        schema: {
          operationId: 'libraryQuery',
          querystring: sQuery.valueOf(),
          response: {
            200: sResult.valueOf(),
          },
        },
      },
      async (req): Promise<typeof sResult.type> => {
        const { page = 1, limit = 10 } = req.query
        let { q } = req.query

        const userId: string = req.session.get('userId')
        if (!userId) {
          throw { statusCode: 401 }
        }

        q = q.trim()

        if (!q) {
          return { result: [] }
        }

        const makeJa = new QSplit({
          default: (v) => {
            return {
              $or: [
                { entry: v },
                { segments: v },
                // { 'reading.kana': katakanaToHiragana(romajiToHiragana(v)) },
                { $text: { $search: v } },
              ],
            }
          },
          fields: {
            entry: { ':': (v) => ({ $or: [{ entry: v }, { segments: v }] }) },
            onyomi: {
              ':': (v) => ({
                reading: {
                  type: 'onyomi',
                  kana: katakanaToHiragana(romajiToHiragana(v)),
                },
              }),
            },
            kunyomi: {
              ':': (v) => ({
                reading: {
                  type: 'kunyomi',
                  kana: katakanaToHiragana(romajiToHiragana(v)),
                },
              }),
            },
            nanori: {
              ':': (v) => ({
                reading: {
                  type: 'nanori',
                  kana: katakanaToHiragana(romajiToHiragana(v)),
                },
              }),
            },
            reading: {
              ':': (v) => ({ 'reading.kana': v }),
            },
            english: { ':': (v) => ({ $text: { $search: v } }) },
            type: { ':': (v) => ({ type: v }) },
          },
        })

        const dCond = makeJa.parse(q) || {}
        const qCond = makeQuiz.parse(q) || {}

        const rs = await EntryModel.aggregate([
          {
            $match: {
              $or: [
                { userId },
                { sharedId: userId },
                { userId: { $exists: false } },
              ],
            },
          },
          ...(Object.keys(qCond).length > 0
            ? [
                {
                  $lookup: {
                    from: 'Quiz',
                    let: { entry: '$entry', type: '$type' },
                    pipeline: [
                      {
                        $match: {
                          $expr: {
                            $and: [
                              { $eq: ['$entry', '$$entry'] },
                              { $eq: ['$type', '$$type'] },
                            ],
                          },
                        },
                      },
                      {
                        $match: qCond,
                      },
                    ],
                    as: 'q',
                  },
                },
                { $match: { 'q.0': { $exists: true } } },
              ]
            : []),
          {
            $lookup: {
              from: 'Library',
              localField: 'entry',
              foreignField: 'entries',
              as: 'lib',
            },
          },
          {
            $unwind: '$lib',
          },
          {
            $addFields: {
              description: ['$description', '$lib.description'],
              tag: { $setUnion: ['$tag', '$lib.tag'] },
            },
          },
          dCond,
          { $sort: { 'lib.updatedAt': -1 } },
          { $skip: (page - 1) * limit },
          { $limit: limit },
          {
            $lookup: {
              from: 'Library',
              localField: 'lib._id',
              foreignField: '_id',
              as: 'lib2',
            },
          },
          {
            $project: {
              _id: '$lib._id',
              title: '$lib.title',
              entries: { $first: 'lib2.entries' },
              type: '$lib.type',
            },
          },
        ])

        return {
          result: rs.map((r) => ({
            ...r,
            id: r._id,
          })),
        }
      }
    )
  }
}

export default libraryRouter
