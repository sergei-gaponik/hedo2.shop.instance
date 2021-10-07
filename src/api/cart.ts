import { context } from '../core/context'
import { InstanceRequestError, InstanceResponse } from '../types';
import { isValidStringArray } from '@sergei-gaponik/hedo2.lib.util'
import { sign, decode } from 'jsonwebtoken'

export async function findCartItems(args): Promise<InstanceResponse> {

  const isValidCartItems = _cartItems => _cartItems.every(c => 
    typeof c == "object" && 
    typeof c.product == "string" && 
    typeof c.variant == "string"
  )

  const cartItems = args.cartItems

  if(!cartItems || !isValidCartItems(cartItems))
    return { errors: [ InstanceRequestError.badRequest ] }
  
  const productIds = cartItems.map(a => a.product)
  const variantIds = cartItems.map(a => a.variant)

  const products = await context().mongoDB.collection('products').find({ _id: { $in: productIds }}).toArray()
  const variants = await context().mongoDB.collection('variants').find({ _id: { $in: variantIds }}).toArray()

  return {
    data: {
      products,
      variants
    }
  }

  
}

export async function signLineItems(args): Promise<InstanceResponse> {

  if(!args.lineItems || !Array.isArray(args.lineItems))
    return { errors: [ InstanceRequestError.badRequest ]}

  let tokens = []

  for(const { variant, price = null } of args.lineItems){

    if(typeof variant != 'string')
      return { errors: [ InstanceRequestError.badRequest ]}

    const _variant = await context().mongoDB.collection("variants").findOne({ _id: variant })

    if(price != null && _variant.price != price)
      return { errors: [ InstanceRequestError.permissionDenied ]}

    tokens.push(sign({ variant, price: _variant.price }, process.env.JWT_SECRET))
  }

  return { data: { tokens }}
}