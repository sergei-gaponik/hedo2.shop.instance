import { context } from "../core/context";
import { InstanceRequestError, InstanceResponse } from "../types";

export async function getBanners(args): Promise<InstanceResponse> {
  const priority = parseInt(args.priority) || 0;

  const banners = await context()
    .mongoDB.collection("banners")
    .find({
      priority: { $gte: priority },
    })
    .toArray();

  return {
    data: { banners },
  };
}
