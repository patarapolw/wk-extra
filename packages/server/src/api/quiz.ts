import { EntryModel, QuizModel } from '@/db/mongo'
import { QSplit } from '@/db/token'
import { FastifyPluginAsync } from 'fastify'
import { katakanaToHiragana, romajiToHiragana } from 'jskana'
import S from 'jsonschema-definer'

const quizRouter: FastifyPluginAsync = async (f) => {
  {
    const sResponse = S.shape({
      result: S.string(),
    })

    const sBody = S.shape({
      entry: S.list(S.string()).minItems(1),
      type: S.string(),
    })

    f.put<{
      Body: typeof sBody.type
    }>(
      '/',
      {
        schema: {
          operationId: 'quizCreate',
          body: sBody.valueOf(),
          response: {
            201: sResponse.valueOf(),
          },
        },
      },
      async (req, reply): Promise<typeof sResponse.type> => {
        const { entry: entries, type } = req.body

        const userId: string = req.session.get('userId')
        if (!userId) {
          throw { statusCode: 401 }
        }

        const r = await QuizModel.insertMany(
          entries.flatMap((entry) =>
            ['je', 'ej'].map((direction) => ({
              userId,
              entry,
              type,
              direction,
            }))
          ),
          { ordered: false }
        ).catch((e) => e)

        console.log(r)

        reply.status(201)
        return {
          result: 'created',
        }
      }
    )
  }

  {
    const sQuery = S.shape({
      id: S.string(),
      d: S.integer(),
    })

    const sResponse = S.shape({
      result: S.string(),
    })

    f.patch<{
      Querystring: typeof sQuery.type
    }>(
      '/doLevel',
      {
        schema: {
          operationId: 'quizDoLevel',
          querystring: sQuery.valueOf(),
          response: {
            201: sResponse.valueOf(),
          },
        },
      },
      async (req, reply): Promise<typeof sResponse.type> => {
        const { id, d } = req.query

        const userId: string = req.session.get('userId')
        if (!userId) {
          throw { statusCode: 401 }
        }

        const q = await QuizModel.findOne({
          userId,
          _id: id,
        })

        if (!q) {
          throw { statusCode: 404 }
        }

        q.updateSRSLevel(d)
        await q.save()

        reply.status(201)
        return {
          result: 'updated',
        }
      }
    )
  }

  {
    const sBody = S.shape({
      entry: S.list(S.string()).minItems(1),
      type: S.string(),
      direction: S.list(S.string()),
    })

    const sResponse = S.shape({
      result: S.string(),
    })

    f.post<{
      Body: typeof sBody.type
    }>(
      '/delete',
      {
        schema: {
          operationId: 'quizDelete',
          body: sBody.valueOf(),
          response: {
            201: sResponse.valueOf(),
          },
        },
      },
      async (req, reply): Promise<typeof sResponse.type> => {
        const { entry: entries, type, direction: dirs = [] } = req.body

        const userId: string = req.session.get('userId')
        if (!userId) {
          throw { statusCode: 401 }
        }

        const r = await QuizModel.deleteMany({
          userId,
          type,
          entry: { $in: entries },
          ...(dirs.length
            ? {
                direction: { $in: dirs },
              }
            : {}),
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
      type: S.string(),
      direction: S.string(),
      stage: S.string(),
      includeUndue: S.boolean(),
    })

    const sResult = S.shape({
      quiz: S.list(
        S.shape({
          id: S.string(),
          nextReview: S.string().format('date-time').optional(),
          stage: S.string(),
          entry: S.string(),
          type: S.string(),
          direction: S.string(),
        })
      ),
      upcoming: S.list(
        S.shape({
          nextReview: S.string().format('date-time').optional(),
        })
      ),
    })

    f.get<{
      Querystring: typeof sQuery.type
    }>(
      '/q',
      {
        schema: {
          operationId: 'quizQuery',
          querystring: sQuery.valueOf(),
          response: {
            200: sResult.valueOf(),
          },
        },
      },
      async (req): Promise<typeof sResult.type> => {
        const {
          type: _types,
          direction: _dirs,
          stage: _stages,
          includeUndue,
        } = req.query
        let { q = '' } = req.query

        const userId: string = req.session.get('userId')
        if (!userId) {
          throw { statusCode: 401 }
        }

        if (!_types || !_dirs || !_stages) {
          return {
            quiz: [],
            upcoming: [],
          }
        }

        q = q.trim()

        const types = _types.split(',')
        const dirs = _dirs.split(',')
        const stages = new Set(_stages.split(','))

        let srsOr: any[] = []
        if (stages.has('new')) {
          srsOr.push({ srsLevel: { $exists: false } })
        }
        if (stages.has('learning')) {
          srsOr.push({ srsLevel: { $lte: 3 } })
        }
        if (stages.has('graduate')) {
          srsOr.push({ srsLevel: { $gt: 3 } })
        }
        if (srsOr.length === 3) {
          srsOr = []
        }

        if (stages.has('leech')) {
          srsOr.push({ wrongStreak: { $gt: 2 } })
        }

        const now = new Date()

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

        const rs = await EntryModel.aggregate([
          {
            $match: {
              $and: [
                { type: { $in: types } },
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
                  $match: {
                    $and: [
                      { userId, direction: { $in: dirs } },
                      ...(srsOr.length === 0 ? [] : [{ $or: srsOr }]),
                    ],
                  },
                },
              ],
              as: 'q',
            },
          },
          {
            $unwind: '$q',
          },
          {
            $addFields: {
              direction: '$q.direction',
              srsLevel: '$q.srsLevel',
              nextReview: '$q.nextReview',
              lastRight: '$q.lastRight',
              lastWrong: '$q.lastWrong',
              maxRight: '$q.maxRight',
              maxWrong: '$q.maxWrong',
              rightStreak: '$q.rightStreak',
              wrongStreak: '$q.wrongStreak',
            },
          },
          dCond,
          {
            $group: {
              _id: '$q._id',
              entry: { $first: '$entry' },
              type: { $first: '$type' },
              direction: { $first: '$direction' },
              nextReview: { $first: '$nextReview' },
              srsLevel: { $first: '$srsLevel' },
              wrongStreak: { $first: '$wrongStreak' },
            },
          },
        ])

        const out: typeof sResult.type = {
          quiz: [],
          upcoming: [],
        }

        const parseR = (r: {
          id: string
          _id: string
          entry: string
          type: string
          direction: string
          srsLevel?: number
          wrongStreak?: number
        }): typeof sResult.type['quiz'][0] => {
          r.id = r._id

          if (r.wrongStreak && r.wrongStreak > 2) {
            return { ...r, stage: 'leech' }
          }

          if (typeof r.srsLevel === 'undefined') {
            return { ...r, stage: 'new' }
          }

          if (r.srsLevel > 3) {
            return {
              ...r,
              stage: 'graduated',
            }
          }

          return { ...r, stage: 'learning' }
        }

        rs.map((r) => {
          if (includeUndue) {
            out.quiz.push(parseR(r))
            return
          }
          if (r.nextReview && r.nextReview > now) {
            out.upcoming.push({
              nextReview: r.nextReview,
            })
          } else {
            out.quiz.push(parseR(r))
          }
        })

        return out
      }
    )
  }
}

export default quizRouter
