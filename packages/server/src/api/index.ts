import { FastifyInstance } from 'fastify'
import swagger from 'fastify-oas'
import fSession from 'fastify-session'
import fCoookie from 'fastify-cookie'
import admin from 'firebase-admin'

import sentenceRouter from './sentence'
import vocabRouter from './vocab'
import characterRouter from './character'

export default (f: FastifyInstance, _: any, next: () => void) => {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SDK!)),
    databaseURL: 'https://wk-extra.firebaseio.com'
  })

  f.register(swagger, {
    routePrefix: '/doc',
    swagger: {
      info: {
        title: 'Swagger API',
        version: '0.1.0'
      },
      consumes: ['application/json'],
      produces: ['application/json'],
      servers: [
        {
          url: 'http://localhost:8080',
          description: 'Local server'
        }
      ]
    },
    exposeRoute: process.env.NODE_ENV === 'development'
  })

  if (process.env.NODE_ENV === 'development') {
    f.register(require('fastify-cors'))
  }

  f.register(fCoookie)
  f.register(fSession, { secret: process.env.SECRET! })

  f.addHook('preHandler', async (req, reply) => {
    if (process.env.NODE_ENV === 'development') {
      return
    }

    if (req.req.url && req.req.url.startsWith('/api/doc')) {
      return
    }

    const m = /^Bearer (.+)$/.exec(req.headers.authorization || '')

    if (!m) {
      reply.status(401).send()
      return
    }

    const ticket = await admin.auth().verifyIdToken(m[1], true)

    if (!req.session.user && ticket.email) {
      return
    }

    reply.status(401).send()
  })

  f.register(sentenceRouter, { prefix: '/sentence' })
  f.register(vocabRouter, { prefix: '/vocab' })
  f.register(characterRouter, { prefix: '/character' })

  next()
}
