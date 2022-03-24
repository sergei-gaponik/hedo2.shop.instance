import { context } from '../core/context'
import { InstanceRequestError, InstanceResponse } from '../types';
import { isValidStringArray } from '@sergei-gaponik/hedo2.lib.util'

export async function getBrand(args): Promise<InstanceResponse> {

  const handle = args.handle

  if(!handle || typeof handle != "string")
    return { errors: [ InstanceRequestError.badRequest ] }

  const brand = await context().mongoDB.collection('brands').findOne({ handle })

  return {
    data: { brand }
  }
}

export async function getBrands(args): Promise<InstanceResponse> {

  const brands = await context().mongoDB.collection('brands').find().toArray()

  return {
    data: { brands }
  }
}

export async function findBrands(args): Promise<InstanceResponse> {

  const ids = args.ids
  const { limit = 24, page = 1 } = args

  if (!isValidStringArray(ids) || isNaN(page) || isNaN(limit))
    return { errors: [ InstanceRequestError.badRequest ] }

  if(!ids.length)
    return { data: { brands: [] }}

  const skip = limit * (page - 1)

  let brands = await context().mongoDB.collection('brands').find({ _id: { $in: ids }}).limit(limit).skip(skip).toArray()

  brands = brands.sort((a, b) => ids.indexOf(a._id) - ids.indexOf(b._id))

  return {
    data: {
      brands
    }
  }
}