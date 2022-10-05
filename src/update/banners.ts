import { context } from "../core/context";
import { InstanceResponse } from "../types";
import { queryAll } from "@sergei-gaponik/hedo2.lib.util";

export async function updateAllBanners(): Promise<InstanceResponse> {
  const gql = `
    query GetBanners($limit: Float!, $page: Float!, $filter: BannerFilter!) {
      banners(limit: $limit, page: $page, filter: $filter) {
        _id
        name
        handle
        href
        color
        image {
          src
        }
        mobileImage {
          src
        }
        priority
        activeFrom
        activeUntil
      }
    }
  `;

  const filter = {
    _json: JSON.stringify({
      _filter: {
        $and: [
          {
            $or: [
              { activeFrom: null },
              { activeFrom: { $exists: false } },
              { activeFrom: { $lte: Date.now() } },
            ],
          },
          {
            $or: [
              { activeUntil: null },
              { activeUntil: { $exists: false } },
              { activeUntil: { $gte: Date.now() } },
            ],
          },
        ],
      },
      _auth: process.env.SYSTEM_API_SECRET,
    }),
  };

  const items = await queryAll(gql, 200, "banners", { filter });

  await context().mongoDB.collection("banners").deleteMany({});

  if (!items.length) {
    return {
      data: {
        insertedCount: 0,
      },
    };
  }

  const { insertedCount } = await context()
    .mongoDB.collection("banners")
    .insertMany(items);

  if (insertedCount != items.length) throw new Error();

  return {
    data: {
      insertedCount,
    },
  };
}
