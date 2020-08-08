import { FastifyInstance } from 'fastify'
import S from 'jsonschema-definer'

import { DbUserModel } from '@/db/mongo'

export default (f: FastifyInstance, _: any, next: () => void) => {
  createUser()

  f.get('/', async (req, reply) => {
    const u = req.session.get('user')
    if (!u) {
      reply.status(401)
      return null
    }

    return u
  })

  f.delete('/', async (req, reply) => {
    const userId = req.session.get('userId')
    if (!userId) {
      reply.status(401)
      return null
    }

    await DbUserModel.purgeOne(userId)
    req.session.delete()
    reply.status(201)
    return null
  })

  f.delete('/signOut', async (req, reply) => {
    req.session.delete()
    reply.status(201)
    return null
  })

  next()

  function createUser() {
    const sBody = S.shape({
      name: S.string(),
      apiKey: S.string(),
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
      async (req, reply) => {
        const userId = req.session.get('userId')
        if (!userId) {
          reply.status(401)
          return null
        }

        const { name, apiKey } = req.body
        const u =
          (await DbUserModel.findById(userId)) ||
          (await DbUserModel.create({
            _id: userId,
            name,
            apiKey,
          }))

        u.name = name
        u.apiKey = apiKey
        u.save()

        req.session.set('user', u)

        reply.status(201)
        return null
      }
    )
  }
}
