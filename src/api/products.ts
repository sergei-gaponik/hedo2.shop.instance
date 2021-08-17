import { context } from '../core/context'
import { InstanceRequestError, InstanceResponse } from '../types';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

const isValidIdArray = ids => (!!ids && Array.isArray(ids) || ids.every(id => typeof(id) == "string"))

const isValidProjection = p => (p == null || Object.values(p).every((v => typeof(v) == "number")))

async function findProducts(args): Promise<InstanceResponse> {

  const ids = args.ids
  const projection = args.projection || null

  if (!isValidIdArray(ids) || !isValidProjection(projection))
    return { errors: [ InstanceRequestError.badRequest ] }

  if(!ids.length)
    return { data: { products: [] }}

  const products = !!projection 
    ? await context().mongoDB.collection('products').find({
        _id: { $in: ids }
      }, { projection }).toArray()
    : await context().mongoDB.collection('products').find({
        _id: { $in: ids }
      }).toArray()

  return {
    data: {
      products
    }
  }
}

async function findOneProduct(args): Promise<InstanceResponse> {

  const query = args.query
  const projection = args.projection || null

  if (!query || typeof(query) != "string" || !isValidProjection(projection))
    return { errors: [ InstanceRequestError.badRequest ] }

  const q = {
    $or: [
      { _id: query },
      { handle: query }
    ]
  }

  const product = !!projection 
    ? await context().mongoDB.collection('products').findOne(q, { projection })
    : await context().mongoDB.collection('products').findOne(q)

  return {
    data: {
      product
    }
  }
}

export {
  findProducts,
  findOneProduct
}