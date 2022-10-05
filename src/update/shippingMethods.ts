import { context } from "../core/context";
import { InstanceResponse } from "../types";
import { queryAll } from "@sergei-gaponik/hedo2.lib.util";

export async function updateAllShippingMethods(): Promise<InstanceResponse> {
  const gql = `
    query GetShippingMethods($limit: Float!, $page: Float!) {
      shippingMethods(limit: $limit, page: $page){
        _id
        name
        serviceProvider
        price
        freeShippingMin
        deliveryTimeFrom
        deliveryTimeTo
      }
    }
  `;

  const items = await queryAll(gql, 200, "shippingMethods");

  await context().mongoDB.collection("shippingmethods").deleteMany({});
  const { insertedCount } = await context()
    .mongoDB.collection("shippingmethods")
    .insertMany(items);

  if (insertedCount != items.length) throw new Error();

  return {
    data: {
      insertedCount,
    },
  };
}
