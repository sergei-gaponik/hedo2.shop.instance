import { context } from '../core/context'
import { InstanceRequestError, InstanceResponse } from '../types';
import { isValidStringArray, isValidProjection } from '@sergei-gaponik/hedo2.lib.util'
import { gqlHandler } from '@sergei-gaponik/hedo2.lib.util';
import validateToken from '../util/validateToken'

async function createUser(user) {

  const createUser = `
    mutation CreateUser($input: UserInput!){
      createUser(input: $input){
        errors
      }
    }
  `

  const r2 = await gqlHandler({
    endpoint: process.env.SYSTEM_API_ENDPOINT,
    query: createUser,
    variables: { 
      input: {
        username: user.sub,
        email: user.email,
        firstName: user.given_name,
        lastName: user.family_name,
        newsletterConsent: user['custom:newsletter_consent'] == "1"
      }
    }
  })

  console.log(r2)
}

export async function getUserAddresses(args): Promise<InstanceResponse> {

  const user = await validateToken(args?.idToken)

  if(!user)
    return { errors: [ InstanceRequestError.permissionDenied ]}

  const getUserAddresses = `
    query GetUserAddresses($username: String!){
      user(filter: { username: $username }){
        _id
      }
    }
  `

  const r = await gqlHandler({
    endpoint: process.env.SYSTEM_API_ENDPOINT,
    query: getUserAddresses,
    variables: { username: user.sub }
  })

  if(r.data.user){
    return { data: { addresses: r.data.user.addresses }}
  }
  else{
    createUser(user)
    return { data: { addresses: [] }}
  }


}