import { context } from "../core/context";
import { InstanceRequestError, InstanceResponse } from "../types";

export async function getShippingMethods(args): Promise<InstanceResponse> {
  const shippingMethods = await context()
    .mongoDB.collection("shippingmethods")
    .find()
    .toArray();

  return {
    data: { shippingMethods },
  };
}
