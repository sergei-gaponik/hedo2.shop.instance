import * as _products from '../api/products'
import * as _filters from '../api/filters'

const routes = {
  ..._products,
  ..._filters
}

export default routes