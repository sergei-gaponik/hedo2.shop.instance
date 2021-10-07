import { context } from '../core/context'
import { InstanceRequestError, InstanceResponse } from '../types';
import { isValidStringArray } from '@sergei-gaponik/hedo2.lib.util'


async function getFilters(args): Promise<InstanceResponse> {

  let response: InstanceResponse = {}

  const _properties = args.properties
  const _appliedFilters = args.appliedFilters

  if(!_properties || !_appliedFilters){
    response.errors = [ InstanceRequestError.missingArgs ]
    return response;
  }

  if(!isValidStringArray(_properties) || !_appliedFilters.every(a => isValidStringArray(a))){
    response.errors = [ InstanceRequestError.badRequest ]
    return;
  }

  const filters = await context().mongoDB.collection("filters").find({ handle: { $in: _properties }}).toArray()

  let hash = {}

  for(const filter of filters){
    const input = {
      handle: filter.handle,
      title: filter.title || filter.name,
      _id: filter._id
    }
  
    if(!hash[filter.category._id]){
      hash[filter.category._id] = {
        _id: filter.category._id,
        name: filter.category.name,
        filters: [ input ]
      }
    }
    else{
      hash[filter.category._id].filters.push(input)
    }
  }

  const r = await context().mongoDB.collection("filters").find({ handle: { $in: _appliedFilters.flat() }}).toArray()
  const appliedFilters = r.map(a => ({ 
    _id: a._id, 
    title: a.title || a.name, 
    handle: a.handle 
  }))

  return { 
    data: { 
      filterCategories: Object.values(hash),
      appliedFilters
    }
  }
}

export {
  getFilters
}