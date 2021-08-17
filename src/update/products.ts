import { context } from '../core/context'
import { InstanceResponse } from '../types'


const queryAll = async (gql: string, limit: number, dataKey: string) => {

  let page = 1
  let data = []

  while (true) {

    let gqlResponse = null;

    const queryArgs = { page, limit }

    gqlResponse = await context().urqlClient.query(gql, queryArgs).toPromise()

    if (gqlResponse.error || !gqlResponse.data) {
      console.log(gqlResponse)
      throw new Error()
    }

    const _data = gqlResponse.data[dataKey]

    data = data.concat(_data)

    if (_data.length < limit) break;

    page++
  }

  return data;
}


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
          title
          price
          items {
            inventoryItem {
              ean
            }
          }
          availableQuantity
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


export {
  updateAllProducts
}