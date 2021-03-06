import { execSync } from 'child_process'
import fs from 'fs'

import { UserModel } from '@/db/mongo'
import { isDevelopment } from '@/shared'
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

  if (!isDevelopment) {
    f.addHook('onRequest', (req, reply, next) => {
      if (['/api/doc', '/api/settings'].some((s) => req.url.startsWith(s))) {
        next()
        return
      }

      f.csrfProtection(req, reply, next)
    })
  }

  f.get('/settings', async (_, reply) => {
    return {
      token: reply.generateCsrf(),
    }
  })

  f.addHook('preHandler', async (req) => {
    if (['/api/doc', '/api/settings'].some((s) => req.url.startsWith(s))) {
      return
    }

    const [apiKey] = /^Bearer (.+)$/.exec(req.headers.authorization || '') || []

    if (!apiKey) {
      throw { statusCode: 401 }
    }

    if (apiKey !== req.session.get('apiKey')) {
      const r = await axios.get<{
        data: {
          id: string
          username: string
          level: number
          preferences: {
            default_voice_actor_id: number
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
        throw { statusCode: r.status < 300 ? 500 : r.status }
      }

      const u = r.data.data
      const updates = {
        username: u.username,
        level: u.level,
        voiceId: u.preferences.default_voice_actor_id,
        autoplayAudio: u.preferences.reviews_autoplay_audio,
      }

      const user = await UserModel.findById(u.id)

      if (user) {
        for (const k of user.isManual || []) {
          delete updates[k]
        }
      }

      await UserModel.updateOne(
        { _id: u.id },
        {
          $set: {
            _id: u.id,
            ...u,
          },
        },
        { upsert: true }
      )

      req.session.set('userId', u.id)
      req.session.set('apiKey', apiKey)
    }
  })

  f.register(utilRouter, { prefix: '/util' })
}

export default apiRouter
