import { context } from '../core/context'
import { InstanceResponse } from '../types'
import { queryAll } from '@sergei-gaponik/hedo2.lib.util'

async function updateAllArticles(): Promise<InstanceResponse>  {

  const gql = `
    query GetArticles($limit: Float!, $page: Float!) {
      articles(limit: $limit, page: $page){
        _id
        name
        handle
        body
        image {
          src
          type
        }
        tags
      }
    }
  `

  const articles = await queryAll(process.env.SYSTEM_API_ENDPOINT, gql, 200, 'articles');

  await context().mongoDB.collection('articles').deleteMany({})
  const { insertedCount } = await context().mongoDB.collection('articles').insertMany(articles)

  if(insertedCount != articles.length)
    throw new Error();
  
  return {
    data: {
      insertedCount
    }
  }
}

export {
  updateAllArticles,
  
}