import fs from 'fs'

import { FastifyInstance } from 'fastify'
import fSession from 'fastify-secure-session'

import { DbUserModel } from '@/db/mongo'
import { filterObjValue, ser } from '@/util'
import { CotterValidateJWT } from '@/util/cotter'

import dictRouter from './dict'
import extraRouter from './extra'
import quizRouter from './quiz'
import userRouter from './user'

export default (f: FastifyInstance, _: any, next: () => void) => {
  if (process.env.NODE_ENV === 'development') {
    f.register(require('fastify-cors'))
  }

  f.register(fSession, { key: fs.readFileSync('session-key') })

  f.addHook('preHandler', function (req, _, done) {
    if (req.body && typeof req.body === 'object') {
      req.log.info(
        {
          body: filterObjValue(
            req.body,
            /**
             * This will keep only primitives, nulls, plain objects, Date, and RegExp
             * ArrayBuffer in file uploads will be removed.
             */
            (v) => ser.hash(v) === ser.hash(ser.clone(v))
          ),
        },
        'parsed body'
      )
    }
    done()
  })

  f.addHook('preHandler', async (req) => {
    const m = /^Bearer (.+)$/.exec(req.headers.authorization || '')

    if (!m) {
      return
    }

    try {
      const token = await CotterValidateJWT(m[1])
      req.session.set('userId', token.identifier)

      if (!req.session.get('user')) {
        const u = await DbUserModel.findById(token.identifier)
        /**
         * Will set null, if not exists
         */
        req.session.set('user', u)
      }
    } catch (_) {}
  })

  f.register(dictRouter, { prefix: '/dict' })
  f.register(extraRouter, { prefix: '/extra' })
  f.register(userRouter, { prefix: '/user' })
  f.register(quizRouter, { prefix: '/quiz' })

  next()
}
