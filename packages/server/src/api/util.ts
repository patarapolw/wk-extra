import { FastifyPluginAsync } from 'fastify'
import S from 'jsonschema-definer'
import Mecab from 'mecab-lite'

const utilRouter: FastifyPluginAsync = async (f) => {
  {
    const mecab = new Mecab()

    const sQuery = S.shape({
      q: S.string(),
    })

    const sResponse = S.shape({
      result: S.list(S.string()),
    })

    f.get<{
      Querystring: typeof sQuery.type
    }>(
      '/tokenize',
      {
        schema: {
          querystring: sQuery.valueOf(),
          response: {
            200: sResponse.valueOf(),
          },
        },
      },
      async (req): Promise<typeof sResponse.type> => {
        return {
          result: mecab.wakatigakiSync(req.query.q),
        }
      }
    )
  }
}

export default utilRouter
