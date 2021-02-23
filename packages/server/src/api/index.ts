import { execSync } from 'child_process'
import fs from 'fs'

import axios from 'axios'
import { FastifyPluginAsync } from 'fastify'
import csrf from 'fastify-csrf'
import fSession from 'fastify-secure-session'

import utilRouter from './util'

const apiRouter: FastifyPluginAsync = async (f) => {
  if (!fs.existsSync('session.key')) {
    execSync('./node_modules/.bin/secure-session-gen-key > session.key')
  }

  f.register(fSession, {
    key: fs.readFileSync('session.key'),
  })

  f.register(csrf, {
    sessionPlugin: 'fastify-secure-session',
  })

  // f.addHook('onRequest', (req, reply, next) => {
  //   if (['/api/doc'].some((s) => req.url.startsWith(s))) {
  //     next()
  //     return
  //   }

  //   f.csrfProtection(req, reply, next)
  // })

  f.get('/settings', async (_, reply) => {
    return {
      token: reply.generateCsrf(),
    }
  })

  f.addHook('preHandler', async (req) => {
    if (
      ['/api/doc', '/api/settings', '/api/util'].some((s) =>
        req.url.startsWith(s)
      )
    ) {
      return
    }

    if (!req.headers.authorization) {
      throw { statusCode: 401 }
    }

    const r = await axios.get<{
      data: {
        id: string
        username: string
        level: number
        preferences: {
          reviews_autoplay_audio: boolean
        }
      }
    }>('https://api.wanikani.com/v2/user', {
      headers: {
        Authorization: req.headers.authorization,
      },
      validateStatus: () => true,
    })

    if (!r?.data?.data?.id) {
      throw { statusCode: 401 }
    }

    const user = r.data.data

    req.session.set('userId', user.id)
  })

  f.register(utilRouter, { prefix: '/util' })
}

export default apiRouter
