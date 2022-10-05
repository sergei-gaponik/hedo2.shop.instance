import { context } from "../core/context";
import {
  InitCheckoutSessionArgs,
  InstanceRequestError,
  InstanceResponse,
  PaymentSession,
} from "../types";
import { gqlHandler, crc } from "@sergei-gaponik/hedo2.lib.util";
import {
  OrderInput,
  OrderStatus,
  PaymentProvider,
  LineItemInput,
  Order,
  Variant,
} from "@sergei-gaponik/hedo2.lib.models";
import { validateLineItems } from "../util/lineItems";
import {
  initStripePaymentSession,
  completeStripePaymentSession,
} from "../payments/stripe";
import {
  initKlarnaPaymentSession,
  completeKlarnaPaymentSession,
} from "../payments/klarna";
import {
  completePaypalPaymentSession,
  initPaypalPaymentSession,
} from "../payments/paypal";
import {
  paymentProviderFromPaymentMethod,
  getShippingCost,
  getSubTotal,
  getTotalVat,
} from "../util/checkout";
import Joi = require("joi");
import { ARRAY_MAX } from "../core/const";

const INIT_LOCK_DURATION = 30 * 1000;
const COMPLETE_LOCK_DURATION = 600 * 1000;
const AUTO_COMPLETE_DELAY = 3600 * 1000;

const initPaymentSession = async (
  paymentProvider: PaymentProvider,
  args: InitCheckoutSessionArgs
): Promise<PaymentSession> => {
  switch (paymentProvider) {
    case PaymentProvider.stripe:
      return await initStripePaymentSession(args);
    case PaymentProvider.klarna:
      return await initKlarnaPaymentSession(args);
    case PaymentProvider.paypal:
      return await initPaypalPaymentSession(args);
  }
};

interface CompleteCheckoutSessionArgs {
  paymentProvider: PaymentProvider;
  uuid: string;
  sessionId: string;
  hppSession: string;
}

const completePaymentSession = async (
  args: CompleteCheckoutSessionArgs
): Promise<boolean> => {
  switch (args.paymentProvider) {
    case PaymentProvider.stripe:
      return await completeStripePaymentSession(args.sessionId);
    case PaymentProvider.klarna:
      return await completeKlarnaPaymentSession(args.hppSession);
    case PaymentProvider.paypal:
      return await completePaypalPaymentSession(args.uuid);
  }
};

let lock = {};

export async function initCheckoutSession(
  args: InitCheckoutSessionArgs
): Promise<InstanceResponse> {
  const hash = crc(JSON.stringify(args));

  if (lock[hash]) return lock[hash];

  setTimeout(() => delete lock[hash], INIT_LOCK_DURATION);

  const schema = Joi.object({
    uuid: Joi.string(),
    lineItems: Joi.array()
      .items(
        Joi.object({
          variant: Joi.string().required(),
          product: Joi.string(),
          quantity: Joi.number().integer().required().min(1),
          price: Joi.number().required().min(0),
          token: Joi.string().required(),
          specialTaxRate: Joi.number(),
          maxQuantity: Joi.number(),
          isGift: Joi.bool().allow(null),
        })
      )
      .min(1)
      .max(ARRAY_MAX),
    paymentInfo: Joi.object({
      paymentMethod: Joi.string().required(),
    }),
    contactInfo: Joi.object({
      privacyPolicyAccepted: Joi.bool(),
      email: Joi.string().email().required(),
      isAuthenticated: Joi.bool(),
      username: Joi.string().allow(""),
    }),
    shippingInfo: Joi.object({
      shippingAddress: Joi.object(),
      billingAddress: Joi.object().allow(null),
      shippingMethod: Joi.object({
        _id: Joi.string().required(),
      }).unknown(true),
      billingAddressMatchesShippingAddress: Joi.bool(),
    }),
  });

  try {
    await schema.validateAsync(args);
  } catch (e) {
    console.log(e);
    return { errors: [InstanceRequestError.badRequest] };
  }

  const lineItems: LineItemInput[] = args.lineItems;
  const shippingMethodId = args.shippingInfo?.shippingMethod?._id;

  const valid = await validateLineItems(lineItems);

  if (!valid) return { errors: [InstanceRequestError.permissionDenied] };

  const shippingMethod = await context()
    .mongoDB.collection("shippingmethods")
    .findOne({ _id: shippingMethodId });

  if (!shippingMethod) return { errors: [InstanceRequestError.badRequest] };

  const paymentProvider = paymentProviderFromPaymentMethod(
    args.paymentInfo.paymentMethod
  );

  if (!paymentProvider) return { errors: [InstanceRequestError.badRequest] };

  const paymentSession = await initPaymentSession(paymentProvider, args);

  if (!paymentSession) return { errors: [InstanceRequestError.badRequest] };

  const subTotal = getSubTotal(lineItems);
  const shippingCost = getShippingCost(shippingMethod, lineItems);
  const vat = await getTotalVat(lineItems);

  const input: OrderInput = {
    status: OrderStatus.open,
    uuid: args.uuid,
    lineItems: args.lineItems,
    shippingAddress: args.shippingInfo.shippingAddress,
    billingAddress: args.shippingInfo.billingAddress,
    billingAddressMatchesShippingAddress:
      args.shippingInfo.billingAddressMatchesShippingAddress,
    email: args.contactInfo.email,
    username: args.contactInfo.username,
    paymentMethod: args.paymentInfo.paymentMethod,
    paymentProvider: paymentProvider,
    paymentSessionId: paymentSession.id,
    hppSessionId: paymentSession.hppSession || null,
    subTotal,
    shippingCost,
    shippingMethod: shippingMethod._id,
    vat,
  };

  const createOrder = `
    mutation CreateOrder($input: OrderInput!){
      createOrder(input: $input){
        errors
      }
    }
  `;

  const r = await gqlHandler({
    query: createOrder,
    variables: { input },
  });

  if (!r.data?.createOrder || r.data.createOrder.errors)
    return { errors: [InstanceRequestError.internalServerError] };

  const response = {
    data: {
      paymentSession,
    },
  };

  setTimeout(
    () =>
      completeCheckoutSession({
        sessionId: paymentSession.id,
        uuid: paymentSession.uuid,
        hppSession: paymentSession.hppSession,
        paymentProvider: paymentProvider,
      }),
    AUTO_COMPLETE_DELAY
  );

  lock[hash] = response;

  return response;
}

export async function completeCheckoutSession(
  args: CompleteCheckoutSessionArgs
): Promise<InstanceResponse> {
  const hash = crc(JSON.stringify(args));

  if (lock[hash]) return lock[hash];

  setTimeout(() => delete lock[hash], COMPLETE_LOCK_DURATION);

  const schema = Joi.object({
    paymentProvider: Joi.string().required(),
    uuid: Joi.string(),
    sessionId: Joi.string(),
    hppSession: Joi.string(),
  });

  try {
    await schema.validateAsync(args);
  } catch (e) {
    console.log(e);
    return { errors: [InstanceRequestError.badRequest] };
  }

  const ok = await completePaymentSession(args);

  if (!ok) {
    const response = { errors: [InstanceRequestError.permissionDenied] };
    lock[hash] = response;
    return response;
  }

  lock[hash] = {};
  return {};
}
