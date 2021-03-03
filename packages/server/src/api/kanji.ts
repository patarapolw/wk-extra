import { DictModel, ExtraModel, RadicalModel, UserModel } from '@/db/mongo'
import { QSplit } from '@/db/token'
import { FastifyPluginAsync } from 'fastify'
import hepburn from 'hepburn'
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
      reading: S.list(
        S.shape({
          type: S.string().optional(),
          kana: S.string(),
        })
      ),
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

        const userId: string = req.session.get('userId')
        if (!userId) {
          throw { statusCode: 401 }
        }

        const rad = await RadicalModel.findOne({ entry })

        let dict = await ExtraModel.findOne({
          $and: [
            { entry, type: 'kanji' },
            { $or: [{ userId }, { sharedId: userId }] },
          ],
        }).then((r) => (r ? { reading: r.reading, english: r.english } : null))

        if (!dict) {
          dict = await DictModel.findOne({
            entry,
            type: 'kanji',
            source: 'wanikani',
          }).then((r) =>
            r
              ? {
                  reading: r.reading.map((r) => ({
                    type: r.type,
                    kana: r.kana[0]!,
                  })),
                  english: r.english,
                }
              : null
          )
        }

        if (!dict) {
          dict = await DictModel.findOne({
            entry,
            type: 'kanji',
          }).then((r) =>
            r
              ? {
                  reading: r.reading.map((r) => ({
                    type: r.type,
                    kana: r.kana[0]!,
                  })),
                  english: r.english,
                }
              : null
          )
        }

        if (!rad && !dict) {
          throw { statusCode: 404 }
        }

        return {
          sub: rad?.sub || [],
          sup: rad?.sup || [],
          var: rad?.var || [],
          reading: dict ? dict.reading : [],
          english: dict?.english || [],
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
          $or: [
            { 'reading.kana': hepburn.toHiragana(hepburn.fromKana(v)) },
            { $text: { $search: v } },
          ],
        }
      },
      fields: {
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
        const { q, limit } = req.query

        const userId: string = req.session.get('userId')
        if (!userId) {
          throw { statusCode: 401 }
        }

        if (!q.trim()) {
          return { result: [] }
        }

        const dCond = makeJa.parse(q)
        const cond = (c?: { source: 'wanikani' }) => {
          const $and: any[] = [{ type: 'kanji' }]

          if (c) {
            $and.push(c)
          }

          if (dCond) {
            $and.push(dCond as any)
          }
          return $and.length > 1 ? { $and } : { [Math.random()]: 1 }
        }

        const rs0 = await ExtraModel.find({
          $and: [cond(), { $or: [{ userId }, { sharedId: userId }] }],
        })
          .sort('-updatedAt')
          .select({
            _id: 0,
            entry: 1,
          })

        let result = rs0.map((r) => {
          return r.entry[0]!
        })

        if (rs0.length < (limit || 5)) {
          let rs = await DictModel.find(cond({ source: 'wanikani' }))
            .sort('-frequency')
            .select({
              _id: 0,
              entry: 1,
              frequency: 1,
            })

          if (!rs.length) {
            rs = await DictModel.find(cond()).sort('-frequency').select({
              _id: 0,
              entry: 1,
              frequency: 1,
            })
          }

          const fMap = new Map<string, number>()
          result.push(
            ...rs.map((r) => {
              if (r.frequency) {
                fMap.set(r.entry[0]!, r.frequency)
              }

              return r.entry[0]!
            })
          )

          if (rs.length) {
            const rCond = makeRad.parse(q)
            if (rCond) {
              rCond.$and.push({ entry: { $in: result } })

              result = await RadicalModel.find(rCond)
                .select({
                  _id: 0,
                  entry: 1,
                })
                .then((rs) =>
                  rs
                    .map((r) => r.entry)
                    .sort((a, b) => (fMap.get(b) || 0) - (fMap.get(a) || 0))
                )
            }
          }
        }

        if (limit) {
          result = result.slice(0, limit)
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
