import { gqlHandler } from '@sergei-gaponik/hedo2.lib.util';

export async function createUser(user) {

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
      }
    }
  })
}