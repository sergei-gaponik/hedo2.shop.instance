import { context } from "../core/context";
import { InstanceResponse } from "../types";
import { queryAll } from "@sergei-gaponik/hedo2.lib.util";

export async function updateAllCustomPages(): Promise<InstanceResponse> {
  const gql = `
    query GetCustomPages($limit: Float!, $page: Float!){
      customPages(limit: $limit, page: $page) {
        _id
        name
        handle
        title
        body
      }
    }
  `;

  const items = await queryAll(gql, 200, "customPages");

  await context().mongoDB.collection("customPages").deleteMany({});
  const { insertedCount } = await context()
    .mongoDB.collection("customPages")
    .insertMany(items);

  if (insertedCount != items.length) throw new Error();

  return {
    data: {
      insertedCount,
    },
  };
}
