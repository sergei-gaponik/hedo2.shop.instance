import { context } from '../core/context'
import { InstanceResponse } from '../types'
import { queryAll } from '@sergei-gaponik/hedo2.lib.util'


export async function updateAllProducts(): Promise<InstanceResponse>  {

  const gql = `
    query GetProductsForInstanceAPI($limit: Float!, $page: Float!) {
      products (dereference: true, limit: $limit, page: $page) {
        _id
        name
        series {
          _id
          name
          handle
        }
        brand {
          _id
          name
          handle
        }
        handle
        variants {
          _id
        }
        properties {
          property {
            _id
          }
          value
        }
        images {
          asset {
            src
          }
        }
      }
    }
  `

  const products = await queryAll(gql, 200, 'products');

  await context().mongoDB.collection('products').deleteMany({})
  const { insertedCount } = await context().mongoDB.collection('products').insertMany(products)

  if(insertedCount != products.length)
    throw new Error();
  
  return {
    data: {
      insertedCount
    }
  }

}