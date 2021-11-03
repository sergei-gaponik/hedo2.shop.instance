import { context } from '../core/context'
import { InstanceResponse } from '../types'
import { queryAll } from '@sergei-gaponik/hedo2.lib.util'


async function updateAllProducts(): Promise<InstanceResponse>  {

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
          src
        }
      }
    }
  `

  const products = await queryAll(process.env.SYSTEM_API_ENDPOINT, gql, 200, 'products');

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

async function updateAllVariants(): Promise<InstanceResponse>  {

  const gql = `
    query GetVariants($limit: Float!, $page: Float!) {
      variants (dereference: true, limit: $limit, page: $page) {
        _id
        title
        overwriteTitle
        measurementUnit
        measurementQuantity
        measurementReferenceValue
        price
        availableQuantity
        maxQuantity
        images {
          src
        }
        products {
          _id
        }
      }
    }
  `

  const variants = await queryAll(process.env.SYSTEM_API_ENDPOINT, gql, 200, 'variants');

  await context().mongoDB.collection('variants').deleteMany({})
  const { insertedCount } = await context().mongoDB.collection('variants').insertMany(variants)

  if(insertedCount != variants.length)
    throw new Error();
  
  return {
    data: {
      insertedCount
    }
  }

}


export {
  updateAllProducts,
  updateAllVariants
}