import path from 'path'
import qs from 'querystring'
import stream from 'stream'

import fastify from 'fastify'
import helmet from 'fastify-helmet'
import fastifyStatic from 'fastify-static'
import pino from 'pino'

import apiRouter from './api'

async function main() {
  const isDevelopment = process.env.NODE_ENV === 'development'

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
  app.register(helmet)

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

  await app.listen(8080, '0.0.0.0')
}

if (require.main === module) {
  main()
}
