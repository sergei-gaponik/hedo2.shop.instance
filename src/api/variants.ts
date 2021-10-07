import { context } from '../core/context'
import { InstanceRequestError, InstanceResponse } from '../types';
import { isValidStringArray, isValidProjection } from '@sergei-gaponik/hedo2.lib.util'

export async function getVariantQuantities(args): Promise<InstanceResponse> {

  if(!args.variants || !isValidStringArray(args.variants))
    return { errors: [ InstanceRequestError.badRequest ]}
  
  const _variants = await context().mongoDB.collection('variants').find({ _id: { $in: args.variants }}).toArray()
  
  const variantQuantities = _variants.map(a => ({ variant: a._id, availableQuantity: a.availableQuantity }))

  return { data: { variantQuantities }}
}