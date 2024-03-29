import { context } from "../core/context";
import { InstanceResponse } from "../types";
import { queryAll } from "@sergei-gaponik/hedo2.lib.util";

export async function updateAllSeries(): Promise<InstanceResponse> {
  const gql = `
    query GetSeries($limit: Float!, $page: Float!) {
      series(dereference: true, limit: $limit, page: $page){
        _id
        name
        handle
        brand {
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
    }
  `;

  const series = await queryAll(gql, 200, "series");

  await context().mongoDB.collection("series").deleteMany({});
  const { insertedCount } = await context()
    .mongoDB.collection("series")
    .insertMany(series);

  if (insertedCount != series.length) throw new Error();

  return {
    data: {
      insertedCount,
    },
  };
}
