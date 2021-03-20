import path from 'path'
import qs from 'querystring'
import stream from 'stream'

import fastify from 'fastify'
import helmet from 'fastify-helmet'
import fastifyStatic from 'fastify-static'
import pino from 'pino'

import apiRouter from './api'
import { initKuromoji, initKuroshiro } from './db/kuro'
import { mongoConnect } from './db/mongo'
import { isDevelopment } from './shared'

async function main() {
  await mongoConnect()

  await initKuromoji()
  await initKuroshiro()

  const logThrough = new stream.PassThrough()
  const logger = pino(
    {
      prettyPrint: isDevelopment,
      serializers: {
        req(req) {
          const [url, q] = req.url.split(/\?(.+)$/)
          const query = q ? qs.parse(q) : undefined

          return { method: req.method, url, query, hostname: req.hostname }
        },
      },
    },
    logThrough
  )
  // logThrough
  //   .pipe(stripANSIStream())
  //   .pipe(
  //     fs.createWriteStream(
  //       path.join('log', dayjs().format('YYYY-MM-DDTHH-mm-ssZZ') + '.log')
  //     )
  //   )
  logThrough.pipe(process.stdout)

  const app = fastify({
    logger,
  })

  if (!isDevelopment) {
    app.register(helmet)
  }

  app.addHook('preHandler', async (req) => {
    const { body, log } = req

    if (body && typeof body === 'object' && body.constructor === Object) {
      log.info({ body }, 'parsed body')
    }
  })

  app.register(fastifyStatic, {
    root: path.resolve('./public'),
  })

  app.register(apiRouter, {
    prefix: '/api',
  })

  const port = parseInt(process.env.PORT || '') || 18797

  await app.listen(port, isDevelopment ? 'localhost' : '0.0.0.0')
}

if (require.main === module) {
  main()
}
