import { FastifyInstance } from 'fastify'
import { WkKanjiModel } from '../db/mongo'

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
            entry: { type: 'string' }
          }
        }
      }
    }
  }, async (req) => {
    const r = await WkKanjiModel.aggregate([
      {
        $match: {
          _id: { $in: req.body.ids }
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
