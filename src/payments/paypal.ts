import {
  PaymentMethod,
  PaymentProvider,
} from "@sergei-gaponik/hedo2.lib.models";
import { gqlHandler } from "@sergei-gaponik/hedo2.lib.util";
import { PaymentSession, InitCheckoutSessionArgs } from "../types";
import { getShippingCost, getSubTotal } from "../util/checkout";
import * as paypal from "@paypal/checkout-server-sdk";
import { context } from "../core/context";

export async function initPaypalPaymentSession(
  args: InitCheckoutSessionArgs
): Promise<PaymentSession> {
  const request = new paypal.orders.OrdersCreateRequest();

  const subTotal = getSubTotal(args.lineItems);
  const shippingCost = getShippingCost(
    args.shippingInfo.shippingMethod,
    args.lineItems
  );

  request.prefer("return=representation");

  request.requestBody({
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: {
          currency_code: "EUR",
          value: (subTotal + shippingCost).toFixed(2),
          breakdown: {
            item_total: {
              currency_code: "EUR",
              value: (subTotal + shippingCost).toFixed(2),
            },
          },
        },
      },
    ],
    locale: "de-DE",
    application_context: {
      shipping_preference: "NO_SHIPPING",
    },
  });

  const order = await context().paypalClient.execute(request);

  return {
    id: order.result.id,
    paymentProvider: PaymentProvider.paypal,
  };
}

export async function completePaypalPaymentSession(uuid: string) {
  const getPaypalOrderId = `
    query GetPaypalOrderId($uuid: String!){
      order(filter: {
        uuid: $uuid
      }){
        paymentSessionId
        paymentProvider
      }
    }
  `;

  const r = await gqlHandler({
    query: getPaypalOrderId,
    variables: { uuid: uuid },
  });

  if (
    r.errors?.length ||
    !r.data.order ||
    r.data.order.paymentProvider != PaymentProvider.paypal
  )
    return false;

  const orderId = r.data.order.paymentSessionId;

  const request = new paypal.orders.OrdersCaptureRequest(orderId);
  request.requestBody({});

  const response = await context().paypalClient.execute(request);

  if (response.result?.status == "COMPLETED") {
    const setOrderPaid = `
        mutation SetOrderPaid($paymentSessionId: String!){
          setOrderStatusPaid(filter: {
            paymentSessionId: $paymentSessionId
          }){
            errors
          }
        }
      `;

    const r2 = await gqlHandler({
      query: setOrderPaid,
      variables: { paymentSessionId: orderId },
    });

    if (
      r2.errors?.length ||
      !r2.data.setOrderStatusPaid ||
      r2.data.setOrderStatusPaid.errors?.length
    )
      return false;
    else return true;
  }
  return false;
}
