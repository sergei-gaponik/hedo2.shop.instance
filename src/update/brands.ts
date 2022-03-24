import { context } from '../core/context'
import { InstanceResponse } from '../types'
import { queryAll } from '@sergei-gaponik/hedo2.lib.util'

export async function updateAllBrands(): Promise<InstanceResponse>  {

  const gql = `
    query GetBrands($limit: Float!, $page: Float!) {
      brands(limit: $limit, page: $page){
        _id
        name
        handle
        featured
        logo {
          src
          type
        }
      }
    }
  `

  const brands = await queryAll(gql, 200, 'brands');

  await context().mongoDB.collection('brands').deleteMany({})
  const { insertedCount } = await context().mongoDB.collection('brands').insertMany(brands)

  if(insertedCount != brands.length)
    throw new Error();
  
  return {
    data: {
      insertedCount
    }
  }
}
