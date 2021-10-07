import { context } from '../core/context'
import { InstanceResponse } from '../types'
import { queryAll } from '@sergei-gaponik/hedo2.lib.util'

async function updateAllBrands(): Promise<InstanceResponse>  {

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

  const brands = await queryAll(process.env.SYSTEM_API_ENDPOINT, gql, 200, 'brands');

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

async function updateAllSeries(): Promise<InstanceResponse>  {

  const gql = `
    query GetSeries($limit: Float!, $page: Float!) {
      series(dereference: true, limit: $limit, page: $page){
        _id
        name
        handle
        brand {
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
    }
  `

  const series = await queryAll(process.env.SYSTEM_API_ENDPOINT, gql, 200, 'series');

  await context().mongoDB.collection('series').deleteMany({})
  const { insertedCount } = await context().mongoDB.collection('series').insertMany(series)

  if(insertedCount != series.length)
    throw new Error();
  
  return {
    data: {
      insertedCount
    }
  }

}


export {
  updateAllBrands,
  updateAllSeries
}