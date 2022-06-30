import * as jwt from 'jsonwebtoken'
import * as fs from 'fs'
import * as path from 'path'
import { UserToken } from '../types'

const pem = fs.readFileSync(path.join(__dirname, '../../cognito.pub.pem'))

export default async function validateToken(idToken): Promise<UserToken>{

  if(!idToken)
    return null;

  try{
    const token = await jwt.verify(idToken, pem, { algorithms: ['RS256'] }) as UserToken

    if(token.email_verified) 
      return token
    else
      return null
  }
  catch(e){
    return null
  }
}