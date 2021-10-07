import { context } from '../core/context'
import { InstanceRequestError, InstanceResponse } from '../types';
import { isValidStringArray, isValidProjection } from '@sergei-gaponik/hedo2.lib.util'

export async function findProducts(args): Promise<InstanceResponse> {

  const ids = args.ids
  const { limit = 24, page = 1 } = args

  if (!isValidStringArray(ids) || isNaN(page) || isNaN(limit))
    return { errors: [ InstanceRequestError.badRequest ] }

  if(!ids.length)
    return { data: { products: [] }}

  const skip = limit * (page - 1)

  let products = await context().mongoDB.collection('products').find({ _id: { $in: ids }}).limit(limit).skip(skip).toArray()

  products = products.sort((a, b) => ids.indexOf(a._id) - ids.indexOf(b._id))

  return {
    data: {
      products
    }
  }
}

export async function findOneProduct(args): Promise<InstanceResponse> {

  const query = args.query

  if (!query || typeof(query) != "string")
    return { errors: [ InstanceRequestError.badRequest ] }

  const product = await context().mongoDB.collection('products').findOne({
    $or: [
      { _id: query },
      { handle: query }
    ]
  })

  return {
    data: {
      product
    }
  }
}