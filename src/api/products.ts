import { context } from "../core/context";
import { InstanceRequestError, InstanceResponse } from "../types";
import {
  isValidStringArray,
  isValidProjection,
} from "@sergei-gaponik/hedo2.lib.util";
import Joi = require("joi");
import { ARRAY_MAX, LIMIT_MAX } from "../core/const";

export async function findProducts(args): Promise<InstanceResponse> {
  const schema = Joi.object({
    ids: Joi.array().items(Joi.string()).max(ARRAY_MAX),
    limit: Joi.number().integer().min(1).max(LIMIT_MAX),
    page: Joi.number().integer().min(1),
  });

  try {
    await schema.validateAsync(args);
  } catch (e) {
    console.log(e);
    return { errors: [InstanceRequestError.badRequest] };
  }

  const ids = args.ids;
  const { limit = 24, page = 1 } = args;

  if (!ids.length) return { data: { products: [] } };

  const skip = limit * (page - 1);

  let products = await context()
    .mongoDB.collection("products")
    .find({ _id: { $in: ids } })
    .limit(limit)
    .skip(skip)
    .toArray();

  const variantIds = [
    ...new Set(products.flatMap((a) => a.variants.map((b) => b._id))),
  ];
  const variants = await context()
    .mongoDB.collection("variants")
    .find({ _id: { $in: variantIds } })
    .toArray();

  products = products.map((product) => ({
    ...product,
    variants: product.variants.map((variant) =>
      variants.find((a) => a._id == variant._id)
    ),
  }));

  products = products.sort((a, b) => ids.indexOf(a._id) - ids.indexOf(b._id));

  return {
    data: {
      products,
    },
  };
}

export async function findOneProduct(args): Promise<InstanceResponse> {
  const query = args.query;

  if (!query || typeof query != "string")
    return { errors: [InstanceRequestError.badRequest] };

  let product = await context()
    .mongoDB.collection("products")
    .findOne({
      $or: [{ _id: query }, { handle: query }],
    });

  const variantIds = product.variants.map((b) => b._id);
  const variants = await context()
    .mongoDB.collection("variants")
    .find({ _id: { $in: variantIds } })
    .toArray();

  product.variants = product.variants.map((variant) =>
    variants.find((a) => a._id == variant._id)
  );

  return {
    data: {
      product,
    },
  };
}
