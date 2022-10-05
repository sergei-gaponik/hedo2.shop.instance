import { context } from "../core/context";
import { InstanceResponse } from "../types";
import { queryAll } from "@sergei-gaponik/hedo2.lib.util";

export async function updateAllBrands(): Promise<InstanceResponse> {
  const gql = `
    query GetBrands($limit: Float!, $page: Float!) {
      brands(limit: $limit, page: $page){
        _id
        name
        handle
        featured
        logo {
          src
          type
        }
      }
    }
  `;

  const items = await queryAll(gql, 200, "brands");

  await context().mongoDB.collection("brands").deleteMany({});

  if (!items.length) {
    return {
      data: {
        insertedCount: 0,
      },
    };
  }

  const { insertedCount } = await context()
    .mongoDB.collection("brands")
    .insertMany(items);

  if (insertedCount != items.length) throw new Error();

  return {
    data: {
      insertedCount,
    },
  };
}
