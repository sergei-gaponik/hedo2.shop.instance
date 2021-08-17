import { context } from '../core/context'
import { InstanceRequestError, InstanceResponse } from '../types';


async function getFilters(args): Promise<InstanceResponse> {

  let response: InstanceResponse = {}

  const _properties = args.properties

  if(!_properties){
    response.errors = [ InstanceRequestError.missingArgs ]
    return response;
  }

  

  return {}
}

