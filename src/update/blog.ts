import { context } from "../core/context";
import { InstanceResponse } from "../types";
import { queryAll } from "@sergei-gaponik/hedo2.lib.util";

export async function updateAllArticles(): Promise<InstanceResponse> {
  const gql = `
    query GetArticles($limit: Float!, $page: Float!) {
      articles(limit: $limit, page: $page){
        _id
        name
        handle
        body
        author
        published
        image {
          src
          type
        }
        tags
      }
    }
  `;

  const items = await queryAll(gql, 200, "articles");

  await context().mongoDB.collection("articles").deleteMany({});

  if (!items.length) {
    return {
      data: {
        insertedCount: 0,
      },
    };
  }

  const { insertedCount } = await context()
    .mongoDB.collection("articles")
    .insertMany(items);

  if (insertedCount != items.length) throw new Error();

  return {
    data: {
      insertedCount,
    },
  };
}
