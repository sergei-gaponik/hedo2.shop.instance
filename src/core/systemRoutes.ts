import * as _product from "../update/products";
import * as _filters from "../update/filters";
import * as _brands from "../update/brands";
import * as _categories from "../update/categories";
import * as _blog from "../update/blog";
import * as _shippingMethods from "../update/shippingMethods";
import * as _series from "../update/series";
import * as _variants from "../update/variants";
import * as _frontPageSections from "../update/frontPageSections";
import * as _customPages from "../update/customPages";
import * as _banners from "../update/banners";

const systemRoutes = {
  ..._product,
  ..._filters,
  ..._brands,
  ..._categories,
  ..._blog,
  ..._shippingMethods,
  ..._series,
  ..._variants,
  ..._frontPageSections,
  ..._customPages,
  ..._banners,
};

export default systemRoutes;
