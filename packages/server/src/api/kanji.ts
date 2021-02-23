import { DictModel, RadicalModel, UserModel } from '@/db/mongo'
import { QSplit } from '@/db/token'
import { FastifyPluginAsync } from 'fastify'
import S from 'jsonschema-definer'
import XRegExp from 'xregexp'

const kanjiRouter: FastifyPluginAsync = async (f) => {
  {
    const sQuery = S.shape({
      entry: S.string(),
    })

    const sResult = S.shape({
      sub: S.list(S.string()),
      sup: S.list(S.string()),
      var: S.list(S.string()),
      kunyomi: S.list(S.string()),
      onyomi: S.list(S.string()),
      nanori: S.list(S.string()),
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

        const rad = await RadicalModel.findOne({ entry })

        let dict = await DictModel.findOne({
          entry,
          type: 'kanji',
          source: 'wanikani',
        })
        if (!dict) {
          dict = await DictModel.findOne({
            entry,
            type: 'kanji',
          })
        }

        if (!rad && !dict) {
          throw { statusCode: 404 }
        }

        return {
          sub: rad?.sub || [],
          sup: rad?.sup || [],
          var: rad?.var || [],
          kunyomi: dict
            ? dict.reading
                .filter((r) => r.type === 'kunyomi')
                .map((r) => r.kana[0]!)
            : [],
          onyomi: dict
            ? dict.reading
                .filter((r) => r.type === 'onyomi')
                .map((r) => r.kana[0]!)
            : [],
          nanori: dict
            ? dict.reading
                .filter((r) => r.type === 'nanori')
                .map((r) => r.kana[0]!)
            : [],
          english: dict?.english || [],
        }
      }
    )
  }

  {
    const sQuery = S.shape({
      q: S.string(),
    })

    const sResult = S.shape({
      result: S.list(S.string()),
    })

    const makeRad = new QSplit({
      default: (v) => {
        if (XRegExp('^\\p{Han}{2,}$').test(v)) {
          const re = XRegExp('\\p{Han}', 'g')
          let m = re.exec(v)
          const out: string[] = []
          while (m) {
            out.push(m[0]!)
            m = re.exec(v)
          }

          return {
            $or: out.map((v) => {
              return { entry: v }
            }),
          }
        } else if (XRegExp('^\\p{Han}$').test(v)) {
          return { $or: [{ entry: v }, { sub: v }, { sup: v }, { var: v }] }
        }

        return {}
      },
      fields: {
        entry: { ':': (v) => ({ entry: v }) },
        kanji: { ':': (v) => ({ entry: v }) },
        sub: { ':': (v) => ({ sub: v }) },
        sup: { ':': (v) => ({ sup: v }) },
        var: { ':': (v) => ({ var: v }) },
      },
    })

    const makeJa = new QSplit({
      default: (v) => {
        if (XRegExp('^\\p{Han}+$').test(v)) {
          return {}
        }

        return {
          $or: [{ 'reading.kana': v }, { $text: { $search: v } }],
        }
      },
      fields: {
        onyomi: { ':': (v) => ({ reading: { type: 'onyomi', kana: v } }) },
        kunyomi: { ':': (v) => ({ reading: { type: 'kunyomi', kana: v } }) },
        nanori: { ':': (v) => ({ reading: { type: 'nanori', kana: v } }) },
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
        const { q } = req.query

        const dCond = makeJa.parse(q)
        const cond = (source?: 'wanikani') => {
          const $and = [{ type: 'kanji' as 'kanji', source }]
          if (dCond) {
            $and.push(dCond as any)
          }
          return { $and }
        }

        let result: string[] = await DictModel.find(cond('wanikani'))
          .select({
            _id: 0,
            entry: 1,
          })
          .then((rs) => rs.map((r) => r.entry[0]!))
        if (!result.length) {
          result = await DictModel.find(cond())
            .select({
              _id: 0,
              entry: 1,
            })
            .then((rs) => rs.map((r) => r.entry[0]!))
        }

        if (result.length) {
          const rCond = makeRad.parse(q)
          if (rCond) {
            rCond.$and.push({ entry: { $in: result } })
            result = await RadicalModel.find(rCond)
              .select({
                _id: 0,
                entry: 1,
              })
              .then((rs) => rs.map((r) => r.entry))
          }
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
                { type: 'kanji' },
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

export default kanjiRouter
