import { UserModel } from '@/db/mongo'
import { FastifyPluginAsync } from 'fastify'
import S from 'jsonschema-definer'

const userRouter: FastifyPluginAsync = async (f) => {
  {
    const sQuery = S.shape({
      select: S.string(),
    })

    const sResult = S.shape({
      levelDisplayVocab: S.list(S.string()).optional(),
    })

    f.get<{
      Querystring: typeof sQuery.type
    }>(
      '/',
      {
        schema: {
          operationId: 'userSettings',
          querystring: sQuery.valueOf(),
          response: {
            200: sResult.valueOf(),
          },
        },
      },
      async (req): Promise<typeof sResult.type> => {
        const { select } = req.query

        const userId: string = req.session.get('userId')
        if (!userId) {
          throw { statusCode: 401 }
        }

        const u = await UserModel.findById(userId).select(
          '-_id ' + select.split(',').join(' ')
        )
        if (!u) {
          throw { statusCode: 401 }
        }

        return u
      }
    )
  }

  {
    const sBody = S.shape({
      levelDisplayVocab: S.list(S.string()).optional(),
    })

    const sResponse = S.shape({
      result: S.string(),
    })

    f.patch<{
      Body: typeof sBody.type
    }>(
      '/',
      {
        schema: {
          operationId: 'userUpdate',
          body: sBody.valueOf(),
          response: {
            201: sResponse.valueOf(),
          },
        },
      },
      async (req, reply): Promise<typeof sResponse.type> => {
        const userId: string = req.session.get('userId')
        if (!userId) {
          throw { statusCode: 401 }
        }

        await UserModel.updateOne({ _id: userId }, { $set: req.body })

        reply.status(201)
        return {
          result: 'updated',
        }
      }
    )
  }
}

export default userRouter
