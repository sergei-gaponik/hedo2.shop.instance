import { LineItem } from '@sergei-gaponik/hedo2.lib.models'
import { context } from '../core/context'
import { verify } from 'jsonwebtoken'
import * as path from 'path'
import * as fs from 'fs'

const pem = fs.readFileSync(path.join(__dirname, '../../cognito.pub.pem'))

export async function validateLineItems(lineItems: LineItem[]): Promise<boolean>{

  for(const { variant, token, price } of lineItems){

    const _variant = await context().mongoDB.collection("variants").findOne({ _id: variant })

    try{
      const decodedToken = await verify(token, process.env.JWT_SECRET) as any

      if(variant != decodedToken.variant || price != decodedToken.price)
        throw new Error();
      
      if(decodedToken.price == _variant.price)
        continue;

      if((decodedToken.iat + parseInt(process.env.LINE_ITEM_VALID_FOR)) * 1000 < Date.now())
        throw new Error();
      
    }
    catch(e){
      return false;
    }
  }

  return true;
}