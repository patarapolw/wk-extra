import { kuromoji } from '@/db/kuro'
import { ExtraModel, SentenceModel, UserModel } from '@/db/mongo'
import { QSplit } from '@/db/token'
import { FastifyPluginAsync } from 'fastify'
import S from 'jsonschema-definer'

const sentenceRouter: FastifyPluginAsync = async (f) => {
  {
    const sQuery = S.shape({
      entry: S.string(),
    })

    const sResult = S.shape({
      ja: S.string(),
      en: S.string(),
    })

    f.get<{
      Querystring: typeof sQuery.type
    }>(
      '/',
      {
        schema: {
          operationId: 'sentenceGetOne',
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

        let dict = await ExtraModel.findOne({
          $and: [
            { entry, type: 'sentence' },
            { $or: [{ userId }, { sharedId: userId }] },
          ],
        }).then((r) => (r ? { ja: r.entry[0]!, en: r.english[0]! } : null))

        if (!dict) {
          dict = await SentenceModel.findOne({
            ja: entry,
            source: 'wanikani',
          }).select({ _id: 0, ja: 1, en: 1 })
        }

        if (!dict) {
          dict = await SentenceModel.aggregate([
            {
              $match: {
                ja: entry,
              },
            },
            { $sample: { size: 1 } },
            { $project: { _id: 0, ja: 1, en: 1 } },
          ]).then((rs) => rs[0] || null)
        }

        if (!dict) {
          throw { statusCode: 404 }
        }

        return {
          ja: dict.ja,
          en: dict.en,
        }
      }
    )
  }

  {
    const reJa = /[\p{sc=Han}\p{sc=Hiragana}\p{sc=Hiragana}]/u
    const getJa = (s: string) => {
      return kuromoji
        .tokenize(s)
        .map((s) => s.basic_form || s.surface_form)
        .filter((v) => reJa.test(v))
    }

    const sQuery = S.shape({
      q: S.string().optional(),
      limit: S.integer().optional(),
      page: S.integer().optional(),
    })

    const sResult = S.shape({
      result: S.list(
        S.shape({
          ja: S.string(),
          en: S.string(),
        })
      ),
    })

    const makeJa = new QSplit({
      default: (v) => {
        return {
          $or: [{ word: { $in: getJa(v) } }, { $text: { $search: v } }],
        }
      },
      fields: {
        entry: { ':': (v) => ({ word: { $in: getJa(v) } }) },
        english: { ':': (v) => ({ $text: { $search: v } }) },
      },
    })

    f.get<{
      Querystring: typeof sQuery.type
    }>(
      '/q',
      {
        schema: {
          operationId: 'sentenceQuery',
          querystring: sQuery.valueOf(),
          response: {
            200: sResult.valueOf(),
          },
        },
      },
      async (req): Promise<typeof sResult.type> => {
        const { q, page, limit = 5 } = req.query

        const userId = req.session.get('userId')
        if (!userId) {
          throw { statusCode: 401 }
        }

        const dCond = makeJa.parse(q)
        const cond = (c?: { source?: 'wanikani'; type?: 'sentence' }) => {
          const $and: any[] = []

          if (c) {
            $and.push(c)
          }

          if (dCond) {
            $and.push(dCond as any)
          }
          return $and.length ? { $and } : {}
        }

        const result = await ExtraModel.find(cond({ type: 'sentence' }))
          .limit(limit)
          .select({ _id: 0, entry: 1, english: 1 })
          .then((rs) => rs.map((r) => ({ ja: r.entry[0]!, en: r.english[0]! })))
          .catch(() => [] as any[])

        if (result.length < limit) {
          const rs1 = await SentenceModel.aggregate([
            { $match: cond() },
            ...(page
              ? [{ $skip: (page - 1) * limit }]
              : [
                  { $addFields: { _sort: { $rand: {} } } },
                  { $sort: { _sort: 1 } },
                ]),
            { $limit: limit - result.length },
            { $project: { _id: 0, ja: 1, en: 1 } },
          ])

          result.push(...rs1)
        }

        return { result }
      }
    )
  }

  {
    const sResult = S.shape({
      result: S.string(),
      english: S.string(),
      level: S.integer(),
    })

    f.get(
      '/random',
      {
        schema: {
          operationId: 'sentenceRandom',
          response: { 200: sResult.valueOf() },
        },
      },
      async (req): Promise<typeof sResult.type> => {
        const userId: string = req.session.get('userId')
        if (!userId) {
          throw { statusCode: 401 }
        }

        const u = await UserModel.findOne({ _id: userId })
        if (!u) {
          throw { statusCode: 401 }
        }

        const [r] = await SentenceModel.aggregate([
          {
            $match: {
              $and: [
                { level: { $lte: u.level } },
                { level: { $gte: u.levelMin } },
              ],
            },
          },
          { $sample: { size: 1 } },
          {
            $project: {
              _id: 0,
              result: '$ja',
              english: '$en',
              level: 1,
            },
          },
        ])

        if (!r) {
          throw { statusCode: 404 }
        }

        return {
          result: r.result,
          english: r.english,
          level: r.level,
        }
      }
    )
  }
}

export default sentenceRouter
