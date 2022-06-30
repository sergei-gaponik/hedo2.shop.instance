import { context } from '../core/context'
import { InstanceRequestError, InstanceResponse } from '../types';
import { isValidStringArray } from '@sergei-gaponik/hedo2.lib.util'
import Joi = require('joi');
import { ARRAY_MAX, LIMIT_MAX } from '../core/const';

export async function getBrand(args): Promise<InstanceResponse> {

  const handle = args.handle

  if(!handle || typeof(handle) != "string")
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

  const schema = Joi.object({
    ids: Joi.array().items(Joi.string()).max(ARRAY_MAX),
    limit: Joi.number().integer().min(1).max(LIMIT_MAX),
    page: Joi.number().integer().min(1),
  })

  try{
    await schema.validateAsync(args)
  }
  catch(e){
    console.log(e)
    return { errors: [ InstanceRequestError.badRequest ] }
  }

  const ids = args.ids
  const { limit = 24, page = 1 } = args

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