import { context } from "../core/context";
import { InstanceRequestError, InstanceResponse } from "../types";
import { queryAll } from "@sergei-gaponik/hedo2.lib.util";

export async function updateAllVariants(args): Promise<InstanceResponse> {
  const getVariants = `
    query GetVariants($limit: Float!, $page: Float!) {
      variants (dereference: true, limit: $limit, page: $page) {
        _id
        title
        ean
        isSet
        numberOfSameArticle
        recommendedRetailPrice
        measurementUnit
        measurementQuantity
        price
        specialTaxRate
        availableQuantity
        maxQuantity
        images {
          asset {
            src
          }
        }
      }
    }
  `;

  const variants = await queryAll(getVariants, 200, "variants");

  await context().mongoDB.collection("variants").deleteMany({});
  const { insertedCount } = await context()
    .mongoDB.collection("variants")
    .insertMany(variants);

  if (insertedCount != variants.length) throw new Error();

  return {
    data: {
      insertedCount,
    },
  };
}

export async function updateVariantsUpdatedSince(
  args
): Promise<InstanceResponse> {
  const getVariants = `
    query GetVariants($limit: Float!, $page: Float!, $filter: VariantFilter!) {
      variants (dereference: true, limit: $limit, page: $page, filter: $filter) {
        _id
        price
        availableQuantity
      }
    }
  `;

  const updatedSince = args.updatedSince || 0;

  if (typeof updatedSince != "number") {
    return { errors: [InstanceRequestError.badRequest] };
  }

  const filter = !updatedSince
    ? {}
    : {
        _json: JSON.stringify({
          _auth: process.env.SYSTEM_API_SECRET,
          _filter: {
            _updated: {
              $gt: updatedSince,
            },
          },
        }),
      };

  const variants = await queryAll(getVariants, 200, "variants", { filter });

  if (!variants.length) return { data: { nModified: 0 } };

  const r = await context()
    .mongoDB.collection("variants")
    .bulkWrite(
      variants.map((variant) => {
        const filter = { _id: variant._id };

        return {
          updateOne: {
            filter,
            update: { $set: variant },
            upsert: true,
          },
        };
      })
    );

  const { nModified } = r.result;

  return {
    data: {
      nModified,
    },
  };
}
