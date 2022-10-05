import * as _products from "../api/products";
import * as _filters from "../api/filters";
import * as _brands from "../api/brands";
import * as _cart from "../api/cart";
import * as _categories from "../api/categories";
import * as _blog from "../api/blog";
import * as _variants from "../api/variants";
import * as _userAddress from "../api/userAddress";
import * as _userOrders from "../api/userOrders";
import * as _shippingMethods from "../api/shippingMethods";
import * as _checkout from "../api/checkout";
import * as _series from "../api/series";
import * as _customPages from "../api/customPages";
import * as _frontPageSections from "../api/frontPageSections";
import * as _banners from "../api/banners";

const routes: any = {
  ..._products,
  ..._series,
  ..._filters,
  ..._brands,
  ..._cart,
  ..._categories,
  ..._blog,
  ..._variants,
  ..._userAddress,
  ..._userOrders,
  ..._shippingMethods,
  ..._checkout,
  ..._customPages,
  ..._frontPageSections,
  ..._banners,
};

export default routes;
