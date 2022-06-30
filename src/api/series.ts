import { context } from '../core/context'
import { InstanceRequestError, InstanceResponse } from '../types';
import { isValidStringArray } from '@sergei-gaponik/hedo2.lib.util'
import Joi = require('joi');
import { join } from 'path';

export async function getOneSeries(args): Promise<InstanceResponse> {

  const handle = args.handle

  if(!handle || typeof(handle) != "string")
    return { errors: [ InstanceRequestError.badRequest ] }
    
  const series = await context().mongoDB.collection('series').findOne({ handle })

  return {
    data: { series }
  }
}

export async function getSeriesForBrand(args): Promise<InstanceResponse> {

  const schema = Joi.object({
    seriesHandle: Joi.string(),
    productHandle: Joi.string(),
    handle: Joi.string()
  })

  try{
    await schema.validateAsync(args)
  }
  catch(e){
    console.log(e)
    return { errors: [ InstanceRequestError.badRequest ] }
  }

  let handle = args.handle
  const seriesHandle = args.seriesHandle
  const productHandle = args.productHandle

  if(!handle){

    if(seriesHandle){
      const _series = await context().mongoDB.collection("series").findOne({ handle: seriesHandle })

      if(!_series)
        return { data: { series: [] }}
      
      handle = _series.brand.handle
    }
    else if(productHandle){
      const _product = await context().mongoDB.collection("products").findOne({ handle: productHandle })

      if(!_product)
        return { data: { series: [] }}
      
      handle = _product.brand.handle
    }
    else{
      return { errors: [ InstanceRequestError.missingArgs ] }
    }
  }

  const series = await context().mongoDB.collection('series').find({ "brand.handle": handle }).toArray()

  return {
    data: { series }
  }
}