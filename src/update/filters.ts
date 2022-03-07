import { context } from '../core/context'
import { InstanceResponse } from '../types'
import { queryAll } from '@sergei-gaponik/hedo2.lib.util'


export async function updateAllFilters(): Promise<InstanceResponse>  {

  const gql = `
    query GetProductProperties($limit: Float!, $page: Float!) {
      productProperties(dereference: true, limit: $limit, page: $page) {
        _id
        category {
          _id
          name
        }
        handle
        name
        dataType
        title
      }
    }
  `

  const productProperties = await queryAll(gql, 200, 'productProperties');

  const filters = productProperties.filter(a => a.dataType == "boolean")

  await context().mongoDB.collection('filters').deleteMany({})
  const { insertedCount } = await context().mongoDB.collection('filters').insertMany(filters)

  if(insertedCount != filters.length)
    throw new Error();
  
  return {
    data: {
      insertedCount
    }
  }

}