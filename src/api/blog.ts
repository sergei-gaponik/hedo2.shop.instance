import { context } from '../core/context'
import { InstanceRequestError, InstanceResponse } from '../types';
import { isValidStringArray } from '@sergei-gaponik/hedo2.lib.util'

export async function getArticle(args): Promise<InstanceResponse> {

  const handle = args.handle

  if(!handle || typeof handle != "string")
    return { errors: [ InstanceRequestError.badRequest ] }

  const article = await context().mongoDB.collection('articles').findOne({ handle })

  return {
    data: { article }
  }
}

export async function getArticles(args): Promise<InstanceResponse> {

  const articles = await context().mongoDB.collection('articles').find({}, { projection: { body: 0 }}).toArray()

  return {
    data: { articles }
  }
}

export async function findArticles(args): Promise<InstanceResponse> {

  const ids = args.ids
  const { limit = 24, page = 1 } = args

  if (!isValidStringArray(ids) || isNaN(page) || isNaN(limit))
    return { errors: [ InstanceRequestError.badRequest ] }

  if(!ids.length)
    return { data: { articles: [] }}

  const skip = limit * (page - 1)

  let articles = await context().mongoDB.collection('articles')
    .find({ _id: { $in: ids }}, { projection: { body: 0 }})
    .limit(limit).skip(skip).toArray()

  articles = articles.sort((a, b) => ids.indexOf(a._id) - ids.indexOf(b._id))

  return {
    data: {
      articles
    }
  }
}
