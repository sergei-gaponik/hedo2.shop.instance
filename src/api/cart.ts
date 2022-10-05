import { context } from "../core/context";
import { InstanceRequestError, InstanceResponse } from "../types";
import { sign, decode } from "jsonwebtoken";
import Joi = require("joi");
import { ARRAY_MAX } from "../core/const";

export async function findCartItems(args): Promise<InstanceResponse> {
  const schema = Joi.object({
    cartItems: Joi.array()
      .items(
        Joi.object({
          product: Joi.string().required(),
          variant: Joi.string().required(),
        })
      )
      .max(ARRAY_MAX),
  });

  try {
    await schema.validateAsync(args);
  } catch (e) {
    console.log(e);
    return { errors: [InstanceRequestError.badRequest] };
  }

  const cartItems = args.cartItems;
  const productIds = cartItems.map((a) => a.product);
  const variantIds = cartItems.map((a) => a.variant);

  const products = await context()
    .mongoDB.collection("products")
    .find({ _id: { $in: productIds } })
    .toArray();
  const variants = await context()
    .mongoDB.collection("variants")
    .find({ _id: { $in: variantIds } })
    .toArray();

  return {
    data: {
      products,
      variants,
    },
  };
}

export async function signLineItems(args): Promise<InstanceResponse> {
  const schema = Joi.object({
    lineItems: Joi.array()
      .items(
        Joi.object({
          variant: Joi.string().required(),
          price: Joi.number(),
        })
      )
      .max(ARRAY_MAX),
  });

  try {
    await schema.validateAsync(args);
  } catch (e) {
    console.log(e);
    return { errors: [InstanceRequestError.badRequest] };
  }

  let tokens = [];

  for (const { variant, price = null } of args.lineItems) {
    const _variant = await context()
      .mongoDB.collection("variants")
      .findOne({ _id: variant });

    if (price != null && _variant.price != price)
      return { errors: [InstanceRequestError.permissionDenied] };

    tokens.push(
      sign({ variant, price: _variant.price }, process.env.JWT_SECRET)
    );
  }

  return { data: { tokens } };
}
