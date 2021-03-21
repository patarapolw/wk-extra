import { kuromoji, kuroshiro } from '@/db/kuro'
import { EntryModel, RadicalModel, UserModel } from '@/db/mongo'
import { QSplit } from '@/db/token'
import { isHan } from '@/db/util'
import { FastifyPluginAsync } from 'fastify'
import { katakanaToHiragana, romajiToHiragana } from 'jskana'
import S from 'jsonschema-definer'

const entryRouter: FastifyPluginAsync = async (f) => {
  {
    const sQuery = S.shape({
      id: S.string(),
    })

    const sResult = S.shape({
      entry: S.string(),
      alt: S.list(S.string()),
      reading: S.list(
        S.shape({
          type: S.string().optional(),
          kana: S.string(),
        })
      ),
      english: S.list(S.string()),
      audio: S.list(S.string()),
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
          operationId: 'entryGetById',
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

        const r = await EntryModel.findOne({
          _id: id,
          userId,
        })

        if (!r) {
          throw { statusCode: 404 }
        }

        return {
          entry: r.entry[0]!,
          alt: r.entry.slice(1),
          reading: r.reading,
          english: r.english,
          type: r.type,
          audio: Object.values(r.audio || {}),
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
      entry: S.string(),
      alt: S.list(S.string()),
      reading: S.list(
        S.shape({
          type: S.string().optional(),
          kana: S.string(),
        })
      ),
      english: S.list(S.string()),
      audio: S.list(S.string()),
      type: S.string().enum('character', 'vocabulary', 'sentence'),
      description: S.string(),
      tag: S.list(S.string()),
    })

    f.put<{
      Body: typeof sBody.type
    }>(
      '/',
      {
        schema: {
          operationId: 'entryCreate',
          body: sBody.valueOf(),
          response: {
            200: sResponse.valueOf(),
          },
        },
      },
      async (req, reply): Promise<typeof sResponse.type> => {
        const {
          entry,
          alt,
          reading: _reading,
          english,
          type,
          description,
          tag,
          audio,
        } = req.body

        const userId: string = req.session.get('userId')
        if (!userId) {
          throw { statusCode: 401 }
        }

        if (type === 'character' && !isHan(entry)) {
          throw { statusCode: 400, message: 'not all Kanji' }
        }

        let segments: string[] = []
        if (type === 'sentence') {
          segments = kuromoji
            .tokenize([entry, ...alt].join(' '))
            .map((t) => t.basic_form.replace('*', '') || t.surface_form)
            .filter((s) =>
              /[\p{sc=Han}\p{sc=Katakana}\p{sc=Hiragana}]/u.test(s)
            )
            .filter((a, i, r) => r.indexOf(a) === i)
        }

        const reading = _reading as {
          type?: string
          kana: string
          hidden?: boolean
        }[]
        if (!reading.length) {
          reading.push({ kana: await kuroshiro.convert(entry) })
        } else {
          reading.map((r) => {
            if (
              /[^\p{sc=Han}\p{sc=Katakana}\p{sc=Hiragana}]/gu.test(r.kana) ||
              /\p{sc=Katakana}/u.test(r.kana)
            ) {
              reading.push({
                ...r,
                kana: katakanaToHiragana(
                  r.kana.replace(
                    /[^\p{sc=Han}\p{sc=Katakana}\p{sc=Hiragana}]/gu,
                    ''
                  )
                ),
                hidden: true,
              })
            }
          })
        }

        const r = await EntryModel.create({
          userId,
          entry: [entry, ...alt],
          segments,
          reading,
          english,
          type,
          description,
          tag,
          audio: Object.fromEntries(audio.map((a, i) => [i.toString(), a])),
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
      entry: S.string(),
      alt: S.list(S.string()),
      reading: S.list(
        S.shape({
          type: S.string().optional(),
          kana: S.string(),
        })
      ),
      english: S.list(S.string()),
      audio: S.list(S.string()),
      type: S.string().enum('character', 'vocabulary', 'sentence'),
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
          operationId: 'entryUpdate',
          querystring: sQuery.valueOf(),
          body: sBody.valueOf(),
          response: {
            200: sResponse.valueOf(),
          },
        },
      },
      async (req, reply): Promise<typeof sResponse.type> => {
        const { id } = req.query
        const {
          entry,
          alt,
          reading: _reading,
          english,
          type,
          description,
          tag,
          audio,
        } = req.body

        const userId: string = req.session.get('userId')
        if (!userId) {
          throw { statusCode: 401 }
        }

        if (type === 'character' && !isHan(entry)) {
          throw { statusCode: 400, message: 'not all Kanji' }
        }

        let segments: string[] = []
        if (type === 'sentence') {
          segments = kuromoji
            .tokenize([entry, ...alt].join(' '))
            .map((t) => t.basic_form.replace('*', '') || t.surface_form)
            .filter((s) =>
              /[\p{sc=Han}\p{sc=Katakana}\p{sc=Hiragana}]/u.test(s)
            )
            .filter((a, i, r) => r.indexOf(a) === i)
        }

        const reading = _reading as {
          type?: string
          kana: string
          hidden?: boolean
        }[]
        reading.map((r) => {
          if (
            /[^\p{sc=Han}\p{sc=Katakana}\p{sc=Hiragana}]/gu.test(r.kana) ||
            /\p{sc=Katakana}/u.test(r.kana)
          ) {
            reading.push({
              ...r,
              kana: katakanaToHiragana(
                r.kana.replace(
                  /[^\p{sc=Han}\p{sc=Katakana}\p{sc=Hiragana}]/gu,
                  ''
                )
              ),
              hidden: true,
            })
          }
        })

        const r = await EntryModel.findOneAndUpdate(
          {
            _id: id,
            userId,
          },
          {
            entry: [entry, ...alt],
            segments,
            english,
            type,
            description,
            tag,
            audio: Object.fromEntries(audio.map((a, i) => [i.toString(), a])),
            ...(reading.length ? { reading } : {}),
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
          operationId: 'entryDelete',
          querystring: sQuery.valueOf(),
          response: {
            200: sResponse.valueOf(),
          },
        },
      },
      async (req, reply): Promise<typeof sResponse.type> => {
        const { id } = req.query

        const userId: string = req.session.get('userId')
        if (!userId) {
          throw { statusCode: 401 }
        }

        const r = await EntryModel.deleteMany({
          userId,
          _id: { $in: id.split(/,/g) },
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
      entry: S.string(),
      type: S.string().enum('character', 'vocabulary', 'sentence'),
    })

    const sResult = S.shape({
      entry: S.string(),
      alt: S.list(S.string()),
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
      '/entry',
      {
        schema: {
          operationId: 'entryGetByEntry',
          querystring: sQuery.valueOf(),
          response: {
            200: sResult.valueOf(),
          },
        },
      },
      async (req): Promise<typeof sResult.type> => {
        const { entry, type } = req.query

        const userId: string = req.session.get('userId')
        if (!userId) {
          throw { statusCode: 401 }
        }

        const rDict = await EntryModel.find({
          $and: [
            { entry: { $in: entry.split(/,/g) }, type },
            {
              $or: [
                { userId },
                { userId: { $exists: false } },
                { sharedId: userId },
              ],
            },
          ],
        })
          .sort('-frequency')
          .select({
            _id: 0,
            entry: 1,
            reading: 1,
            english: 1,
            source: 1,
          })

        if (!rDict.length) {
          throw { statusCode: 404 }
        }

        const rMap: Record<
          'user' | 'wanikani' | 'others',
          {
            entry: string[]
            reading: {
              type?: string
              kana: string
            }[]
            english: string[]
            source?: string
          }[]
        > = {
          user: [],
          wanikani: [],
          others: [],
        }

        rDict.map((d) => {
          const v = {
            entry: d.entry,
            reading: d.reading
              .filter((r) => !r.hidden)
              .map(({ type, kana }) => ({ type, kana })),
            english: d.english,
            source: d.source,
          }

          switch (d.source) {
            case undefined:
              rMap.user.push(v)
              break
            case 'wanikani':
              rMap.user.push(v)
              break
            default:
              rMap.others.push(v)
          }
        })

        let result = [...rMap.user, ...rMap.others]
        if (
          rMap.user.length &&
          rMap.user.some(({ reading }) => reading.length) &&
          rMap.user.some(({ english }) => english.length)
        ) {
          result = rMap.user
        } else if (rMap.wanikani.length) {
          result = [...rMap.user, ...rMap.wanikani]
        }

        const entries = result
          .flatMap((r) => r.entry)
          .filter((a, i, r) => r.indexOf(a) === i)
        if (!entries.length) {
          throw { statusCode: 404 }
        }

        let reading = result.flatMap((r) => r.reading)
        const readingStr = reading.map((r) => r.kana)
        reading = reading.filter((a, i) => readingStr.indexOf(a.kana) === i)

        const english = result
          .flatMap((r) => r.english)
          .filter((a, i, r) => r.indexOf(a) === i)

        return {
          entry: entries[0]!,
          alt: entries.slice(1),
          reading,
          english,
        }
      }
    )
  }

  {
    const sQuery = S.shape({
      q: S.string(),
      page: S.integer().optional(),
      limit: S.integer().optional(),
      all: S.boolean().optional(),
      type: S.string().enum('character', 'vocabulary', 'sentence').optional(),
    })

    const sResult = S.shape({
      result: S.list(
        S.shape({
          id: S.string(),
          entry: S.list(S.string()),
          reading: S.list(
            S.shape({
              type: S.string().optional(),
              kana: S.string(),
            })
          ),
          english: S.list(S.string()),
          type: S.string(),
          source: S.string().optional(),
        })
      ),
    })

    const makeRad = new QSplit({
      default: (v) => {
        if (/^\p{sc=Han}{2,}$/u.test(v)) {
          const re = /\p{sc=Han}/gu
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
        } else if (isHan(v)) {
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

    f.get<{
      Querystring: typeof sQuery.type
    }>(
      '/q',
      {
        schema: {
          operationId: 'entryQuery',
          querystring: sQuery.valueOf(),
          response: {
            200: sResult.valueOf(),
          },
        },
      },
      async (req): Promise<typeof sResult.type> => {
        const { page = 1, limit = 10, all, type } = req.query
        let { q } = req.query

        const userId: string = req.session.get('userId')
        if (!userId) {
          throw { statusCode: 401 }
        }

        q = q.trim()

        if (!q) {
          return { result: [] }
        }

        let entries: string[] | null = null
        if (type === 'character') {
          const m = /(^| )\p{sc=Han}+( |$)/u.exec(q)
          if (m) {
            q = q.replace(m[1]!, ' ').trim()
            const rCond = makeRad.parse(m[0])

            if (rCond) {
              entries = await RadicalModel.find(rCond)
                .select('-_id entry')
                .then((rs) => rs.map((r) => r.entry))

              if (!entries?.length) {
                return { result: [] }
              }
            }
          }
        }

        const makeJa = new QSplit({
          default: (v) => {
            if (entries) {
              return {}
            }

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

        const rs = await EntryModel.find({
          $and: [
            ...(type ? [{ type }] : []),
            ...(entries ? [{ entry: { $in: entries } }] : []),
            dCond,
            {
              $or: [
                { userId },
                { sharedId: userId },
                ...(all ? [{ userId: { $exists: false } }] : []),
              ],
            },
          ],
        })
          .sort('-updatedAt')
          .skip((page - 1) * limit)
          .limit(limit)
          .select({
            entry: 1,
            reading: 1,
            english: 1,
            type: 1,
            source: 1,
          })
          .catch(() => [] as any[])

        const rMap: Record<
          'user' | 'wanikani' | 'others',
          {
            id: string
            entry: string[]
            reading: {
              type?: string
              kana: string
            }[]
            english: string[]
            type: string
            source?: string
          }[]
        > = {
          user: [],
          wanikani: [],
          others: [],
        }

        rs.map((d) => {
          const v = {
            id: d._id,
            entry: d.entry,
            reading: (d.reading as any[])
              .filter((r) => !r.hidden)
              .map(({ type, kana }) => ({ type, kana })),
            english: d.english,
            type: d.type,
            source: d.source,
          }

          switch (d.source) {
            case undefined:
              rMap.user.push(v)
              break
            case 'wanikani':
              rMap.user.push(v)
              break
            default:
              rMap.others.push(v)
          }
        })

        return {
          result: [...rMap.user, ...rMap.wanikani, ...rMap.others],
        }
      }
    )
  }

  {
    const sQuery = S.shape({
      type: S.string().enum('character', 'vocabulary', 'sentence'),
    })

    const sResult = S.shape({
      result: S.string(),
      english: S.string(),
      level: S.integer(),
    })

    f.get<{
      Querystring: typeof sQuery.type
    }>(
      '/random',
      {
        schema: {
          operationId: 'entryRandom',
          querystring: sQuery.valueOf(),
          response: { 200: sResult.valueOf() },
        },
      },
      async (req): Promise<typeof sResult.type> => {
        const { type } = req.query

        const userId: string = req.session.get('userId')
        if (!userId) {
          throw { statusCode: 401 }
        }

        const u = await UserModel.findOne({ _id: userId })
        if (!u) {
          throw { statusCode: 401 }
        }

        const [r] = await EntryModel.aggregate([
          {
            $match: {
              $and: [
                { level: { $lte: u.level } },
                { level: { $gte: u.levelMin } },
                { type },
              ],
            },
          },
          { $sample: { size: 1 } },
          {
            $project: {
              _id: 0,
              result: { $first: '$entry' },
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

export default entryRouter
