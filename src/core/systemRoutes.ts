import * as _product from '../update/products'
import * as _filters from '../update/filters'
import * as _brands from '../update/brands'
import * as _categories from '../update/categories'
import * as _blog from '../update/blog'
import * as _shippingMethods from '../update/shippingMethods'

const systemRoutes = { 
  ..._product,
  ..._filters,
  ..._brands,
  ..._categories,
  ..._blog,
  ..._shippingMethods
}

export default systemRoutes