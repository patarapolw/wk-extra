import { DictModel, UserModel } from '@/db/mongo'
import { QSplit } from '@/db/token'
import { FastifyPluginAsync } from 'fastify'
import hepburn from 'hepburn'
import S from 'jsonschema-definer'

const vocabRouter: FastifyPluginAsync = async (f) => {
  {
    const sQuery = S.shape({
      entry: S.string(),
    })

    const sResult = S.shape({
      entry: S.list(S.string()),
      reading: S.list(S.string()),
      english: S.list(S.string()),
    })

    f.get<{
      Querystring: typeof sQuery.type
    }>(
      '/',
      {
        schema: {
          querystring: sQuery.valueOf(),
          response: {
            200: sResult.valueOf(),
          },
        },
      },
      async (req): Promise<typeof sResult.type> => {
        const { entry } = req.query

        let dict = await DictModel.findOne({
          entry,
          type: 'vocabulary',
          source: 'wanikani',
        })
        if (!dict) {
          dict = await DictModel.find({
            entry,
            type: 'vocabulary',
          })
            .sort('-frequency')
            .limit(1)
            .then((rs) => rs[0] || null)
        }

        if (!dict) {
          throw { statusCode: 404 }
        }

        return {
          entry: dict.entry,
          reading: dict.reading.map((r) => r.kana[0]!),
          english: dict.english,
        }
      }
    )
  }

  {
    const sQuery = S.shape({
      q: S.string(),
      limit: S.integer().optional(),
    })

    const sResult = S.shape({
      result: S.list(S.string()),
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
        reading: {
          ':': (v) => ({
            'reading.kana': hepburn.toHiragana(hepburn.fromKana(v)),
          }),
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
        const { q, limit } = req.query

        const dCond = makeJa.parse(q)
        const cond = (source?: 'wanikani') => {
          const $and = [{ type: 'vocabulary' as 'vocabulary', source }]
          if (dCond) {
            $and.push(dCond as any)
          }
          return { $and }
        }

        let docQuery = DictModel.find(cond('wanikani'))
          .sort('-frequency')
          .select({
            _id: 0,
            entry: 1,
          })
        if (limit) {
          docQuery = docQuery.limit(limit)
        }

        let result = await docQuery.then((rs) => rs.map((r) => r.entry[0]!))

        if (!result.length) {
          docQuery = DictModel.find(cond()).sort('-frequency').select({
            _id: 0,
            entry: 1,
          })
          if (limit) {
            docQuery = docQuery.limit(limit)
          }

          result = await docQuery.then((rs) => rs.map((r) => r.entry[0]!))
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
      { schema: { response: { 200: sResult.valueOf() } } },
      async (req): Promise<typeof sResult.type> => {
        const userId: string = req.session.get('userId')
        if (!userId) {
          throw { statusCode: 401 }
        }

        const u = await UserModel.findOne({ _id: userId })
        if (!u) {
          throw { statusCode: 401 }
        }

        const [r] = await DictModel.aggregate([
          {
            $match: {
              $and: [
                { level: { $gte: u.level } },
                { level: { $lte: u.levelMin } },
                { type: 'vocabulary' },
              ],
            },
          },
          { $sample: { size: 1 } },
          {
            $project: {
              _id: 0,
              result: { $first: 'entry' },
              english: 1,
              level: 1,
            },
          },
        ])

        if (!r) {
          throw { statusCode: 404 }
        }

        return {
          result: r.result,
          english: r.english.join(' / '),
          level: r.level,
        }
      }
    )
  }
}

export default vocabRouter
