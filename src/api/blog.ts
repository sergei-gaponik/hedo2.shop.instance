import { context } from "../core/context";
import { InstanceRequestError, InstanceResponse } from "../types";
import { isValidStringArray } from "@sergei-gaponik/hedo2.lib.util";
import Joi = require("joi");
import { ARRAY_MAX, LIMIT_MAX } from "../core/const";

export async function getArticle(args): Promise<InstanceResponse> {
  const handle = args.handle;

  if (!handle || typeof handle != "string")
    return { errors: [InstanceRequestError.badRequest] };

  const article = await context()
    .mongoDB.collection("articles")
    .findOne({ handle });

  return {
    data: { article },
  };
}

export async function getArticles(args): Promise<InstanceResponse> {
  const articles = await context()
    .mongoDB.collection("articles")
    .find({}, { projection: { body: 0 } })
    .toArray();

  return {
    data: { articles },
  };
}

export async function findArticles(args): Promise<InstanceResponse> {
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

  if (!ids.length) return { data: { articles: [] } };

  const skip = limit * (page - 1);

  let articles = await context()
    .mongoDB.collection("articles")
    .find({ _id: { $in: ids } }, { projection: { body: 0 } })
    .limit(limit)
    .skip(skip)
    .toArray();

  articles = articles.sort((a, b) => ids.indexOf(a._id) - ids.indexOf(b._id));

  return {
    data: {
      articles,
    },
  };
}
