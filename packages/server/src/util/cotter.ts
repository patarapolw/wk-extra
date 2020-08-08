import axios from 'axios'
import * as jsonwebtoken from 'jsonwebtoken'
import jwkToPem from 'jwk-to-pem'

const CotterBaseURL = 'https://www.cotter.app/api/v0'
const CotterJWTKID = 'SPACE_JWT_PUBLIC:8028AAA3-EC2D-4BAA-BE7A-7C8359CCB9F9'
const jwksPath = '/token/jwks'
const jwtAlgo = 'ES256'

interface PublicKey extends jwkToPem.ECPrivate {
  kid: string
  use: string
}

interface PublicKeys {
  keys: PublicKey[]
}

interface PublicKeyMeta {
  instance: PublicKey
  pem: string
}

interface MapOfKidToPublicKey {
  [key: string]: PublicKeyMeta
}

let cacheKeys: MapOfKidToPublicKey | undefined
const getPublicKeys = async (
  cotterBaseURL: string
): Promise<MapOfKidToPublicKey> => {
  if (!cacheKeys) {
    const url = `${cotterBaseURL}${jwksPath}`
    const publicKeys = await axios.get<PublicKeys>(url)
    cacheKeys = publicKeys.data.keys.reduce((agg, current) => {
      const pem = jwkToPem(current)
      agg[current.kid] = { instance: current, pem }
      return agg
    }, {} as MapOfKidToPublicKey)
    return cacheKeys
  } else {
    return cacheKeys
  }
}

export const CotterValidateJWT = async (token: string) => {
  const jwtKeys = await getPublicKeys(CotterBaseURL)
  const pubKey = jwtKeys[CotterJWTKID]

  /**
   * @see https://docs.cotter.app/getting-access-token/handling-authentication-with-cotter#cotters-id-token
   */
  return new Promise<{
    identifier: string
  }>((resolve, reject) => {
    jsonwebtoken.verify(
      token,
      pubKey.pem,
      { algorithms: [jwtAlgo] },
      (err: any, decoded: any) => {
        err ? reject(err) : resolve(decoded)
      }
    )
  })
}
