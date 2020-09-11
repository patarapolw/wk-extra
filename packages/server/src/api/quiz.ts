import { FastifyInstance } from 'fastify'
import S from 'jsonschema-definer'

import { zhDict } from '@/db/local'
import { DbQuizModel, DbUserModel, sDbQuizExport } from '@/db/mongo'
import {
  sDateTime,
  sId,
  sQuizDirection,
  sQuizStat,
  sQuizType,
  sSrsLevel,
} from '@/util/schema'

export default (f: FastifyInstance, _: any, next: () => void) => {
  postGetByIds()
  postGetByEntries()
  doMark()
  getTagAll()
  postInit()
  doCreateByEntry()
  doUpdateSet()
  doDelete()
  postDeleteByIds()

  next()

  function postGetByIds() {
    const sBody = S.shape({
      ids: S.list(S.string()),
      select: S.list(S.string()),
    })

    const sResponse = S.shape({
      result: S.list(sDbQuizExport),
    })

    f.post<{
      Body: typeof sBody.type
    }>(
      '/ids',
      {
        schema: {
          body: sBody.valueOf(),
          response: {
            200: sResponse.valueOf(),
          },
        },
      },
      async (req, reply): Promise<typeof sResponse.type> => {
        const userId = req.session.get('userId')
        if (!userId) {
          reply.status(401)
          return {
            result: [],
          }
        }

        const { ids, select } = req.body
        const result = await DbQuizModel.find({
          _id: { $in: ids },
          userId,
        }).select(select.join(' '))

        return { result }
      }
    )
  }

  function postGetByEntries() {
    const sBody = S.shape({
      entries: S.list(S.string()).minItems(1),
      select: S.list(S.string()),
      type: sQuizType,
    })

    const sResponse = S.shape({
      result: S.list(sDbQuizExport),
    })

    f.post<{
      Body: typeof sBody.type
    }>(
      '/entries',
      {
        schema: {
          body: sBody.valueOf(),
          response: {
            200: sResponse.valueOf(),
          },
        },
      },
      async (req, reply): Promise<typeof sResponse.type> => {
        const userId = req.session.get('userId')
        if (!userId) {
          reply.status(401)
          return {
            result: [],
          }
        }

        const { entries, select, type } = req.body

        const result = (await DbQuizModel.find({
          entry: { $in: entries },
          type,
          userId,
        }).select(select.join(' '))) as any

        return {
          result,
        }
      }
    )
  }

  function doMark() {
    const sQuery = S.shape({
      id: sId,
      type: S.string().enum('right', 'wrong', 'repeat'),
    })

    f.patch<{
      Querystring: typeof sQuery.type
    }>(
      '/mark',
      {
        schema: {
          querystring: sQuery.valueOf(),
        },
      },
      async (
        req,
        reply
      ): Promise<{
        error?: string
      }> => {
        const userId = req.session.get('userId')
        if (!userId) {
          reply.status(401)
          return {}
        }

        const { id, type } = req.query

        const quiz = await DbQuizModel.findOne({
          userId,
          _id: id,
        })
        if (!quiz) {
          reply.status(404)
          return {}
        }

        ;({
          right: () => quiz.markRepeat(),
          wrong: () => quiz.markWrong(),
          repeat: () => quiz.markRepeat(),
        }[type]())

        await quiz.save()

        reply.status(201)
        return {}
      }
    )
  }

  function getTagAll() {
    const sResponse = S.shape({
      tags: S.list(S.string()),
    })

    f.get(
      '/tag/all',
      {
        schema: {
          response: {
            200: sResponse.valueOf(),
          },
        },
      },
      async (
        req,
        reply
      ): Promise<{
        tags: []
      }> => {
        const userId = req.session.get('userId')
        if (!userId) {
          reply.status(401)
          return {
            tags: [],
          }
        }

        const r = await DbQuizModel.aggregate([
          { $match: { userId } },
          {
            $group: {
              _id: null,
              tags: { $addToSet: '$tag' },
            },
          },
        ])

        return {
          tags: ((r[0] || {}).tags || []).sort(),
        }
      }
    )
  }

  function postInit() {
    const myStage = S.string().enum('new', 'leech', 'learning', 'graduated')

    const sBody = S.shape({
      type: S.list(sQuizType),
      stage: S.list(myStage),
      direction: S.list(sQuizDirection),
      isDue: S.boolean().optional(),
      tag: S.list(S.string()).optional(),
    })

    const sQuizItem = S.shape({
      _id: sId,
      srsLevel: sSrsLevel.optional(),
      nextReview: sDateTime.optional(),
      stat: sQuizStat.optional(),
    })

    const sResponse = S.shape({
      quiz: S.list(sQuizItem),
      upcoming: S.list(sDateTime).optional(),
    })

    f.post<{
      Body: typeof sBody.type
    }>(
      '/init',
      {
        schema: {
          body: sBody.valueOf(),
          response: {
            200: sResponse.valueOf(),
          },
        },
      },
      async (req, reply): Promise<typeof sResponse.type> => {
        const userId = req.session.get('userId')
        if (!userId) {
          reply.status(401)
          return {
            quiz: [],
          }
        }

        const { type, stage, direction, isDue: _isDue, tag } = req.body
        const isDue = !!_isDue

        /**
         * No need to await
         */
        DbUserModel.findByIdAndUpdate(userId, {
          $set: {
            'settings.quiz.type': type,
            'settings.quiz.stage': stage,
            'settings.quiz.direction': direction,
            'settings.quiz.isDue': isDue,
          },
        })

        const $or: any[] = []

        if (stage.includes('new')) {
          $or.push({
            srsLevel: { $exists: false },
          })
        }

        if (stage.includes('leech')) {
          $or.push({
            'stat.streak.wrong': { $gte: 3 },
          })
        }

        if (stage.includes('learning')) {
          $or.push({
            srsLevel: { $lt: 3 },
          })
        }

        if (stage.includes('graduated')) {
          $or.push({
            srsLevel: { $gte: 3 },
          })
        }

        const rs = await DbQuizModel.find({
          $and: [
            {
              userId,
              type: { $in: type },
              direction: { $in: direction },
              ...(tag ? { tag: { $in: tag } } : {}),
            },
            ...($or.length ? [{ $or }] : []),
          ],
        }).select('_id nextReview srsLevel stat')

        if (isDue) {
          const now = new Date()
          const quiz: typeof sQuizItem.type[] = []
          const upcoming: string[] = []

          rs.map(({ nextReview, srsLevel, stat, _id }) => {
            if (!nextReview || nextReview < now) {
              quiz.push({
                nextReview: nextReview ? nextReview.toISOString() : undefined,
                srsLevel,
                stat: stat ? JSON.parse(JSON.stringify(stat)) : undefined,
                _id,
              })
            } else {
              upcoming.push(nextReview.toISOString())
            }
          })

          return {
            quiz: quiz.sort(() => 0.5 - Math.random()),
            upcoming: upcoming.sort(),
          }
        } else {
          return {
            quiz: rs.sort(() => 0.5 - Math.random()),
          }
        }
      }
    )
  }

  function doCreateByEntry() {
    const sBody = S.shape({
      entry: S.anyOf(S.string(), S.list(S.string())),
      type: sQuizType,
      direction: S.list(sQuizDirection).minItems(1).optional(),
    })

    f.put<{
      Body: typeof sBody.type
    }>(
      '/',
      {
        schema: {
          body: sBody.valueOf(),
        },
      },
      async (
        req,
        reply
      ): Promise<{
        error?: string
      }> => {
        const userId = req.session.get('userId')
        if (!userId) {
          reply.status(401)
          return {}
        }

        const {
          entry,
          type,
          direction = type === 'zh'
            ? ['entry', 'alt', 'reading', 'english']
            : ['entry', 'reading', 'english'],
        } = req.body
        const entries = Array.isArray(entry) ? entry : [entry]

        if (direction.includes('alt')) {
          const v = zhDict.cedict.findOne({
            $or: [{ entry }, { alt: { $in: entry } }],
          })
          if (!v || !v.alt || !v.alt.length) {
            const i = direction.indexOf('alt')
            if (i !== -1) {
              direction.splice(i, 1)
            }
          }
        }

        try {
          await DbQuizModel.insertMany(
            entries.flatMap((entry) => {
              return direction.map((dir) => ({
                userId,
                entry,
                type,
                direction: dir,
              }))
            }),
            { ordered: false }
          )
        } catch (e) {
          if (e.nInserted === 0) {
            reply.status(304)
            return {
              error: 'No quiz items created',
            }
          }

          const writeCount = new Map<string, number>()

          ;(e.writeErrors || []).map(({ op: { entry } }: any) => {
            writeCount.set(entry, (writeCount.get(entry) || 0) + 1)
          })

          const failedEntries = Array.from(writeCount)
            .filter(([, count]) => count >= 2)
            .map(([k]) => k)

          if (failedEntries.length) {
            reply.status(304)
            return {
              error: `The following quiz items failed to create: ${failedEntries.join(
                ','
              )}`,
            }
          }
        }

        reply.status(201)
        return {}
      }
    )
  }

  function doUpdateSet() {
    const sQuery = S.shape({
      id: sId,
    })

    const sBody = S.shape({
      set: S.shape({
        front: S.string().optional(),
        back: S.string().optional(),
        mnemonic: S.string().optional(),
        tag: S.list(S.string()).optional(),
      }),
    })

    f.patch<{
      Querystring: typeof sQuery.type
      Body: typeof sBody.type
    }>(
      '/',
      {
        schema: {
          querystring: sQuery.valueOf(),
          body: sBody.valueOf(),
        },
      },
      async (
        req,
        reply
      ): Promise<{
        error?: string
      }> => {
        const userId = req.session.get('userId')
        if (!userId) {
          reply.status(401)
          return {}
        }

        const { id } = req.query
        const { set } = req.body

        const $set: any = {}
        const $unset: any = {}

        Object.entries(set).map(([k, v]) => {
          if (v === '') {
            $unset[k] = ''
          } else if (Array.isArray(v) && v.length === 0) {
            $unset[k] = ''
          } else {
            $set[k] = v
          }
        })

        await DbQuizModel.findOneAndUpdate(
          {
            userId,
            _id: id,
          },
          {
            $set,
            $unset,
          }
        )

        reply.status(201)
        return {}
      }
    )
  }

  function doDelete() {
    const sQuery = S.shape({
      id: sId,
    })

    f.delete<{
      Querystring: typeof sQuery.type
    }>(
      '/',
      {
        schema: {
          querystring: sQuery.valueOf(),
        },
      },
      async (
        req,
        reply
      ): Promise<{
        error?: string
      }> => {
        const userId = req.session.get('userId')
        if (!userId) {
          reply.status(401)
          return {}
        }

        const { id } = req.query
        await DbQuizModel.deleteOne({
          _id: id,
          userId,
        })

        reply.status(201)
        return {}
      }
    )
  }

  function postDeleteByIds() {
    const sBody = S.shape({
      ids: S.list(S.string()).minItems(1),
    })

    f.post<{
      Body: typeof sBody.type
    }>(
      '/delete/ids',
      {
        schema: {
          body: sBody.valueOf(),
        },
      },
      async (req, reply): Promise<{ error?: string }> => {
        const userId = req.session.get('userId')
        if (!userId) {
          reply.status(401)
          return {}
        }

        const { ids } = req.body
        await DbQuizModel.deleteMany({
          _id: { $in: ids },
          userId,
        })

        reply.status(201)
        return {}
      }
    )
  }
}