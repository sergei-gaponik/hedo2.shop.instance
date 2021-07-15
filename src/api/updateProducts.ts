import { Product } from '@sergei-gaponik/hedo2.lib.models'
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


async function updateAllProducts() {

  const gql = `
    query GetProductsForInstanceAPI($limit: Float!, $page: Float!) {
      products (dereference: true, limit: $limit, page: $page) {
        _id
        name
        series
        brand
        variants {
          title
          items {
            inventoryItem {
              ean
            }
          }
        }
        properties {
          property {
            _id
          }
          value
        }
      }
    }
  `

  const products: Product[] = await queryAll(gql, 200, 'products');

  const productCollection = await context().mongoDB.collection('products');

  const updated = [];
  const upserted = [];
  const errors = [];

  await Promise.all(products.map(async (product: Product) => {

    try {

      const updateRes = await productCollection.updateOne(
        { _id: product._id },
        { $set: product },
        { upsert: true }
      );

      const { upsertedCount, modifiedCount, result } = updateRes;
      console.log(modifiedCount)

      if (result.ok === 1) {
        if (upsertedCount) upserted.push(product._id);
        else if (modifiedCount) updated.push(product._id);
      }
      else throw new Error();

    } catch (_) {
      errors.push(`error while updating product ${product._id}`);
    }

  }));

  const data = {
    updatedCount: updated.length,
    upsertedCount: upserted.length
  };

  const result: InstanceResponse = { data }
  if (errors.length) result.errors = errors;

  return result;

}


export {
  updateAllProducts
}