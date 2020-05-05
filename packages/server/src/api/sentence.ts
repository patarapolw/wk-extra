import { FastifyInstance } from 'fastify'
import { WkSentenceModel } from '../db/mongo'

export default (f: FastifyInstance, _: any, next: () => void) => {
  f.post('/random', {
    schema: {
      tags: ['sentence'],
      summary: 'Random sentence from a list of allow vocab',
      body: {
        type: 'object',
        required: ['ids'],
        properties: {
          ids: { type: 'array', items: { type: 'integer' } }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            ja: { type: 'string' },
            en: { type: 'string' }
          }
        }
      }
    }
  }, async (req) => {
    const r = await WkSentenceModel.aggregate([
      {
        $match: {
          vocab: { $in: req.body.ids }
        }
      },
      {
        $sample: { size: 1 }
      }
    ])

    return r[0] || {}
  })

  next()
}
