import { context } from "../core/context";
import { InstanceRequestError, InstanceResponse } from "../types";
import { isValidStringArray } from "@sergei-gaponik/hedo2.lib.util";
import Joi = require("joi");

async function getFilters(args): Promise<InstanceResponse> {
  const schema = Joi.object({
    properties: Joi.array().items(Joi.string()),
    appliedFilters: Joi.array().items(Joi.array().items(Joi.string())),
  });

  try {
    await schema.validateAsync(args);
  } catch (e) {
    console.log(e);
    return { errors: [InstanceRequestError.badRequest] };
  }

  let response: InstanceResponse = {};

  const _properties = args.properties;
  const _appliedFilters = args.appliedFilters;

  const filters = await context()
    .mongoDB.collection("filters")
    .find({ handle: { $in: _properties } })
    .toArray();

  let hash = {};

  for (const filter of filters) {
    const input = {
      handle: filter.handle,
      title: filter.title || filter.name,
      categoryId: filter.category._id,
      _id: filter._id,
    };

    if (!hash[filter.category._id]) {
      hash[filter.category._id] = {
        _id: filter.category._id,
        name: filter.category.name,
        filters: [input],
      };
    } else {
      hash[filter.category._id].filters.push(input);
    }
  }

  const r = await context()
    .mongoDB.collection("filters")
    .find({ handle: { $in: _appliedFilters.flat() } })
    .toArray();
  const appliedFilters = r.map((a) => ({
    _id: a._id,
    title: a.title || a.name,
    handle: a.handle,
  }));

  return {
    data: {
      filterCategories: Object.values(hash),
      appliedFilters,
    },
  };
}

export { getFilters };
