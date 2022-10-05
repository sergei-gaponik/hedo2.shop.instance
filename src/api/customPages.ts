import Joi = require("joi");
import { context } from "../core/context";
import { InstanceRequestError, InstanceResponse } from "../types";

export async function getCustomPage(args): Promise<InstanceResponse> {
  const handle = args.handle;

  if (!handle || typeof handle != "string")
    return { errors: [InstanceRequestError.badRequest] };

  const customPage = await context()
    .mongoDB.collection("customPages")
    .findOne({ handle });

  if (!customPage) return { errors: [InstanceRequestError.notFound] };

  return {
    data: { customPage },
  };
}
