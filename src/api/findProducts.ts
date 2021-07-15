import { context } from '../core/context'

async function findProducts(ids: string[]) {

  if (!ids || !ids.length)
    throw new Error('missing productIDs');

  // const objectIDs = ids.map(Types.ObjectId)
  // console.log(objectIDs)

  const productCollection = await context().mongoDB.collection('products')

  const products = await productCollection.find({
    _id: { $in: ids }
  });

  return products
}