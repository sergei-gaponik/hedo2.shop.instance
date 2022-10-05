import {
  PaymentMethod,
  PaymentProvider,
} from "@sergei-gaponik/hedo2.lib.models";
import { gqlHandler } from "@sergei-gaponik/hedo2.lib.util";
import { PaymentSession, InitCheckoutSessionArgs } from "../types";
import { getShippingCost, getSubTotal } from "../util/checkout";
import fetch from "node-fetch";

async function klarnaHandler(endpoint, body, method) {
  const res = await fetch(`${process.env.KLARNA_ENDPOINT}${endpoint}`, {
    method: method,
    body: body ? JSON.stringify(body) : null,
    headers: {
      "content-type": "application/json",
      authorization:
        "Basic " +
        Buffer.from(
          process.env.KLARNA_UID + ":" + process.env.KLARNA_PW
        ).toString("base64"),
    },
  });

  return await res.json();
}

async function createPaymentSession(args: InitCheckoutSessionArgs) {
  const toMoney = (amount) => Math.round(amount * 100);

  const subTotal = toMoney(getSubTotal(args.lineItems));
  const shippingCost = toMoney(
    getShippingCost(args.shippingInfo.shippingMethod, args.lineItems)
  );
  const billingAddress = args.shippingInfo.billingAddressMatchesShippingAddress
    ? args.shippingInfo.shippingAddress
    : args.shippingInfo.billingAddress;

  const body = {
    purchase_country: "DE",
    purchase_currency: "EUR",
    locale: "de-DE",
    order_amount: subTotal + shippingCost,
    order_tax_amount: 0,
    billing_address: {
      city: billingAddress.city,
      country: billingAddress.country,
      email: args.contactInfo.email,
      family_name: billingAddress.lastName,
      given_name: billingAddress.firstName,
      postal_code: billingAddress.zipCode,
      street_address: billingAddress.addressLine,
      street_address2: billingAddress.addressLine2,
    },
    order_lines: [
      {
        name: "Zwischensumme",
        quantity: 1,
        unit_price: subTotal,
        tax_rate: 0,
        total_amount: subTotal,
        total_discount_amount: 0,
        total_tax_amount: 0,
      },
      {
        name: "Versandkosten",
        quantity: 1,
        unit_price: shippingCost,
        tax_rate: 0,
        total_amount: shippingCost,
        total_discount_amount: 0,
        total_tax_amount: 0,
      },
    ],
  };

  return await klarnaHandler("/payments/v1/sessions", body, "POST");
}

async function createHppSession(sessionId, paymentMethod) {
  const body = {
    payment_session_url: `${process.env.KLARNA_ENDPOINT}/payments/v1/sessions/${sessionId}`,
    merchant_urls: {
      success: `${process.env.SHOP_DOMAIN}/checkout/success?sid={{session_id}}&p=klarna&authtoken={{authorization_token}}`,
      cancel: `${process.env.SHOP_DOMAIN}/checkout`,
      back: `${process.env.SHOP_DOMAIN}/checkout`,
      failure: `${process.env.SHOP_DOMAIN}/checkout/cancel`,
      error: `${process.env.SHOP_DOMAIN}/checkout/cancel`,
    },
    options: {
      payment_method_category:
        paymentMethod == PaymentMethod.paylater ? "pay_later" : "pay_now",
    },
  };

  return await klarnaHandler("/hpp/v1/sessions", body, "POST");
}

export async function initKlarnaPaymentSession(
  args: InitCheckoutSessionArgs
): Promise<PaymentSession> {
  const { session_id } = await createPaymentSession(args);
  const hppSession = await createHppSession(
    session_id,
    args.paymentInfo.paymentMethod
  );

  return {
    id: session_id,
    hppSession: hppSession.session_id,
    redirect: hppSession.redirect_url,
    paymentProvider: PaymentProvider.klarna,
  };
}

export async function completeKlarnaPaymentSession(sessionId: string) {
  const r = await klarnaHandler(`/hpp/v1/sessions/${sessionId}`, null, "GET");

  if (r.status == "COMPLETED") {
    const setOrderPaid = `
      mutation SetOrderPaid($hppSessionId: String!){
        setOrderStatusPaid(filter: {
          hppSessionId: $hppSessionId
        }){
          errors
        }
      }
    `;

    const r = await gqlHandler({
      query: setOrderPaid,
      variables: { hppSessionId: sessionId },
    });

    if (
      r.errors?.length ||
      !r.data.setOrderStatusPaid ||
      r.data.setOrderStatusPaid.errors?.length
    )
      return false;
    else return true;
  }

  return false;
}
