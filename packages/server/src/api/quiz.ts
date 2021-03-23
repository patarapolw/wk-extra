import { kuromoji, kuroshiro } from '@/db/kuro'
import { EntryModel, QuizModel } from '@/db/mongo'
import { QSplit, qDateUndefined, qNumberUndefined } from '@/db/token'
import arrayShuffle from 'array-shuffle'
import { FastifyPluginAsync } from 'fastify'
import { katakanaToHiragana, romajiToHiragana } from 'jskana'
import S from 'jsonschema-definer'

const quizRouter: FastifyPluginAsync = async (f) => {
  {
    const sResponse = S.shape({
      result: S.string(),
    })

    const sBody = S.shape({
      entry: S.list(
        S.anyOf(
          S.string(),
          S.shape({
            entry: S.string(),
            alt: S.list(S.string()).optional(),
            reading: S.list(S.string()).optional(),
            english: S.list(S.string()).optional(),
          })
        )
      ).minItems(1),
      type: S.string(),
      description: S.string().optional(),
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
        const { entry: _entries, type, description = '' } = req.body

        const userId: string = req.session.get('userId')
        if (!userId) {
          throw { statusCode: 401 }
        }

        const entries = _entries.map((it) =>
          typeof it === 'string' ? it : it.entry
        )

        const rDict = await EntryModel.find({
          $and: [
            { entry: { $in: entries }, type },
            {
              $or: [
                { userId },
                { userId: { $exists: false } },
                { sharedId: userId },
              ],
            },
          ],
        })
        const existingEntries = new Set(rDict.flatMap((r) => r.entry))
        const newEntries = _entries.filter(
          (it) => !existingEntries.has(typeof it === 'string' ? it : it.entry)
        )
        if (newEntries.length) {
          await EntryModel.insertMany(
            await Promise.all(
              newEntries.map(async (entry) => {
                const el = typeof entry === 'string' ? { entry } : entry
                return {
                  userId,
                  entry: [el.entry, ...(el.alt || [])],
                  type,
                  segments:
                    type === 'sentence'
                      ? kuromoji
                          .tokenize(el.entry)
                          .map(
                            (t) =>
                              t.basic_form.replace('*', '') || t.surface_form
                          )
                          .filter((s) =>
                            /[\p{sc=Han}\p{sc=Katakana}\p{sc=Hiragana}]/u.test(
                              s
                            )
                          )
                          .filter((a, i, r) => r.indexOf(a) === i)
                      : [],
                  reading: el.reading?.length
                    ? el.reading
                    : [await kuroshiro.convert(el.entry)],
                  english: el.english || [],
                  description,
                }
              })
            )
          )
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
          { ordered: false, rawResult: true }
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
      direction: S.list(S.string()).minItems(1).optional(),
    })

    const sResponse = S.shape({
      result: S.string(),
    })

    f.post<{
      Body: typeof sBody.type
    }>(
      '/delete/entries',
      {
        schema: {
          operationId: 'quizDeleteByEntries',
          body: sBody.valueOf(),
          response: {
            201: sResponse.valueOf(),
          },
        },
      },
      async (req, reply): Promise<typeof sResponse.type> => {
        const { entry: entries, type, direction: dirs } = req.body

        const userId: string = req.session.get('userId')
        if (!userId) {
          throw { statusCode: 401 }
        }

        const r = await QuizModel.deleteMany({
          userId,
          type,
          entry: { $in: entries },
          ...(dirs
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
    const sBody = S.shape({
      q: S.string(),
      type: S.list(S.string()),
      direction: S.list(S.string()),
      stage: S.list(S.string()),
      include: S.list(S.string().enum('undue')),
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

    f.post<{
      Body: typeof sBody.type
    }>(
      '/get/init',
      {
        schema: {
          operationId: 'quizGetInit',
          body: sBody.valueOf(),
          response: {
            200: sResult.valueOf(),
          },
        },
      },
      async (req): Promise<typeof sResult.type> => {
        const {
          type: types,
          direction: dirs,
          stage: stages,
          include,
        } = req.body
        let { q = '' } = req.body

        const userId: string = req.session.get('userId')
        if (!userId) {
          throw { statusCode: 401 }
        }

        if (!types.length || !dirs.length || !stages.length) {
          return {
            quiz: [],
            upcoming: [],
          }
        }

        q = q.trim()

        let srsOr: any[] = []
        if (stages.includes('new')) {
          srsOr.push({ srsLevel: { $exists: false } })
        }
        if (stages.includes('learning')) {
          srsOr.push({ srsLevel: { $lte: 3 } })
        }
        if (stages.includes('graduate')) {
          srsOr.push({ srsLevel: { $gt: 3 } })
        }
        if (srsOr.length === 3) {
          srsOr = []
        }

        if (stages.includes('leech')) {
          srsOr.push({ wrongStreak: { $gt: 2 } })
        }

        const now = new Date()

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

        const qCond = makeQuiz.parse(q)

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
                      ...(qCond ? [qCond] : []),
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
          if (include.includes('undue')) {
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

        return {
          quiz: arrayShuffle(out.quiz),
          upcoming: out.upcoming,
        }
      }
    )
  }

  {
    const sBody = S.shape({
      entry: S.list(S.string()).minItems(1),
      type: S.string(),
      direction: S.list(S.string()).minItems(1).optional(),
    })

    const sResponse = S.shape({
      result: S.list(
        S.shape({
          id: S.string(),
          entry: S.string(),
          type: S.string(),
          direction: S.string(),
        })
      ),
    })

    f.post<{
      Body: typeof sBody.type
    }>(
      '/get/entries',
      {
        schema: {
          operationId: 'quizGetByEntries',
          body: sBody.valueOf(),
          response: {
            200: sResponse.valueOf(),
          },
        },
      },
      async (req): Promise<typeof sResponse.type> => {
        const { entry: entries, type, direction: dirs } = req.body

        const userId: string = req.session.get('userId')
        if (!userId) {
          throw { statusCode: 401 }
        }

        const result = await QuizModel.find({
          $and: [
            {
              entry: { $in: entries },
              type,
              ...(dirs ? { direction: { $in: dirs } } : {}),
            },
            {
              $or: [
                { userId },
                { userId: { $exists: false } },
                { sharedId: userId },
              ],
            },
          ],
        }).select('_id entry type direction')

        return {
          result: result.map((r) => ({
            id: r._id,
            entry: r.entry,
            type: r.type,
            direction: r.direction,
          })),
        }
      }
    )
  }

  {
    const sBody = S.shape({
      entry: S.list(S.string()).minItems(1),
      type: S.string(),
    })

    const sResponse = S.shape({
      result: S.list(
        S.shape({
          entry: S.string(),
          srsLevel: S.integer(),
        })
      ),
    })

    f.post<{
      Body: typeof sBody.type
    }>(
      '/get/srsLevelByEntries',
      {
        schema: {
          operationId: 'quizGetSrsLevelByEntries',
          body: sBody.valueOf(),
          response: {
            200: sResponse.valueOf(),
          },
        },
      },
      async (req): Promise<typeof sResponse.type> => {
        const { entry: entries, type } = req.body

        const userId: string = req.session.get('userId')
        if (!userId) {
          throw { statusCode: 401 }
        }

        const result = await QuizModel.aggregate([
          {
            $match: {
              $and: [
                {
                  entry: { $in: entries },
                  type,
                },
                {
                  $or: [
                    { userId },
                    { userId: { $exists: false } },
                    { sharedId: userId },
                  ],
                },
              ],
            },
          },
          {
            $group: {
              _id: '$entry',
              srsLevel: { $max: '$srsLevel' },
            },
          },
          { $match: { srsLevel: { $exists: true } } },
        ])

        return {
          result: result.map((r) => ({
            entry: r._id,
            srsLevel: r.srsLevel,
          })),
        }
      }
    )
  }
}

export default quizRouter
