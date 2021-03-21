import { kuromoji, kuroshiro } from '@/db/kuro'
import { FastifyPluginAsync } from 'fastify'
import S from 'jsonschema-definer'
import Text2Speech from 'node-gtts'

const utilRouter: FastifyPluginAsync = async (f) => {
  {
    const sQuery = S.shape({
      q: S.string(),
    })

    const sResponse = S.shape({
      result: S.list(
        S.shape({
          surface_form: S.string(),
        }).additionalProperties(true)
      ),
    })

    f.get<{
      Querystring: typeof sQuery.type
    }>(
      '/tokenize',
      {
        schema: {
          operationId: 'utilTokenize',
          querystring: sQuery.valueOf(),
          response: {
            200: sResponse.valueOf(),
          },
        },
      },
      async (req): Promise<typeof sResponse.type> => {
        return {
          result: kuromoji.tokenize(req.query.q),
        }
      }
    )
  }

  {
    const sQuery = S.shape({
      q: S.string(),
    })

    const sResponse = S.shape({
      result: S.string(),
    })

    f.get<{
      Querystring: typeof sQuery.type
    }>(
      '/reading',
      {
        schema: {
          operationId: 'utilReading',
          querystring: sQuery.valueOf(),
          response: {
            200: sResponse.valueOf(),
          },
        },
      },
      async (req): Promise<typeof sResponse.type> => {
        return {
          result: await kuroshiro.convert(req.query.q),
        }
      }
    )
  }

  {
    const sQuerystring = S.shape({
      q: S.string(),
    })

    f.get<{
      Querystring: typeof sQuerystring.type
    }>(
      '/speak',
      {
        schema: {
          operationId: 'utilSpeak',
          querystring: sQuerystring.valueOf(),
        },
      },
      (req, reply) => {
        const gtts = Text2Speech('ja')
        reply.send(gtts.stream(req.query.q))
      }
    )
  }
}

export default utilRouter
