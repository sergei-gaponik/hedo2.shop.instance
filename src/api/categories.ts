import { context } from "../core/context";
import { InstanceRequestError, InstanceResponse } from "../types";
import { isValidStringArray } from "@sergei-gaponik/hedo2.lib.util";
import Joi = require("joi");
import { ARRAY_MAX, LIMIT_MAX } from "../core/const";

export async function getCategory(args): Promise<InstanceResponse> {
  const handle = args.handle;

  if (!handle || typeof handle != "string")
    return { errors: [InstanceRequestError.badRequest] };

  let projection: any = {};

  if (!!args.noParent) projection.parent = 0;
  if (!!args.noChildren) projection.children = 0;

  const category = await context()
    .mongoDB.collection("categories")
    .findOne({ handle }, { projection });

  return {
    data: { category },
  };
}

export async function getCategories(args): Promise<InstanceResponse> {
  let filter: any = {};
  let projection: any = {};

  if (!!args.root) filter.parent = null;
  if (!!args.root || !!args.noParent) projection.parent = 0;
  if (!!args.noChildren) projection.children = 0;

  const categories = await context()
    .mongoDB.collection("categories")
    .find(filter, { projection })
    .toArray();

  return {
    data: { categories },
  };
}

export async function findCategories(args): Promise<InstanceResponse> {
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

  if (!ids.length) return { data: { categories: [] } };

  const skip = limit * (page - 1);

  let categories = await context()
    .mongoDB.collection("categories")
    .find({ _id: { $in: ids } })
    .limit(limit)
    .skip(skip)
    .toArray();

  categories = categories.sort(
    (a, b) => ids.indexOf(a._id) - ids.indexOf(b._id)
  );

  return {
    data: {
      categories,
    },
  };
}
