import * as _products from '../api/products'
import * as _filters from '../api/filters'
import * as _brands from '../api/brands'
import * as _cart from '../api/cart'
import * as _categories from '../api/categories'
import * as _blog from '../api/blog'
import * as _variants from '../api/variants'
import * as _userAddress from '../api/userAddress'
import * as _shippingMethods from '../api/shippingMethods'

const routes = {
  ..._products,
  ..._filters,
  ..._brands,
  ..._cart,
  ..._categories,
  ..._blog,
  ..._variants,
  ..._userAddress,
  ..._shippingMethods
}

export default routes