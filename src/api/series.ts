import { context } from '../core/context'
import { InstanceRequestError, InstanceResponse } from '../types';
import { isValidStringArray } from '@sergei-gaponik/hedo2.lib.util'

export async function getOneSeries(args): Promise<InstanceResponse> {

  const handle = args.handle

  if(!handle || typeof handle != "string")
    return { errors: [ InstanceRequestError.badRequest ] }

  const series = await context().mongoDB.collection('series').findOne({ handle })

  return {
    data: { series }
  }
}

export async function getSeriesForBrand(args): Promise<InstanceResponse> {

  let handle = args.handle
  const seriesHandle = args.seriesHandle

  if((handle && typeof handle != "string") || (seriesHandle && typeof seriesHandle != "string"))
    return { errors: [ InstanceRequestError.badRequest ] }

  if(!handle){
    
    if(!seriesHandle)
      return { errors: [ InstanceRequestError.missingArgs ] }

    const _series = await context().mongoDB.collection("series").findOne({ handle: seriesHandle })

    if(!_series)
      return { data: { series: [] }}
    
    handle = _series.brand.handle
  }

  const series = await context().mongoDB.collection('series').find({ "brand.handle": handle }).toArray()

  return {
    data: { series }
  }
}