import { context } from '../core/context'
import { InstanceResponse } from '../types'
import { queryAll } from '@sergei-gaponik/hedo2.lib.util'


async function updateAllCategories(): Promise<InstanceResponse>  {

  const gql = `
    query GetCategories($limit: Float!, $page: Float!) {
      productCategories(limit: $limit, page: $page, dereference: true){
        _id
        name
        title
        handle
        featured
        parent {
          _id
        }
        andCondition {
          properties {
            _id
            handle
          }
        }
      }
    }
  `

  const _categories = await queryAll(gql, 200, 'productCategories');

  const dereference = id => {
    return _categories
      .filter(a => a.parent?._id == id)
      .map(a => f(a))
  }

  const f = category => {

    const filters = category.filters || category.andCondition
      .filter(a => a.properties.length)
      .map(a => a.properties.map(b => b.handle))
    
    category.filters = filters

    delete category.andCondition

    category.children = JSON.parse(JSON.stringify(dereference(category._id)))

    return category
  }

  const dereferenceParent = category => {

    if(category.parent){
      const c = _categories.find(a => a._id == category.parent._id)
      if(c){
        category.parent = JSON.parse(JSON.stringify(dereferenceParent(c)))

        if(category.parent.children) 
          delete category.parent.children
      }

    }
    
    return category;
  }

  const categories = _categories
    .map(c => f(c))
    .map(c => dereferenceParent(c))
  

  await context().mongoDB.collection('categories').deleteMany({})
  const { insertedCount } = await context().mongoDB.collection('categories').insertMany(categories)

  if(insertedCount != categories.length)
    throw new Error();
  
  return {
    data: {
      insertedCount
    }
  }
}

export {
  updateAllCategories
}