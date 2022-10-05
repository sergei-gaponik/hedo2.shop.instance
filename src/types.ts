import {
  PaymentMethod,
  Address,
  ShippingMethod,
  LineItemInput,
  PaymentProvider,
} from "@sergei-gaponik/hedo2.lib.models";

export enum InstanceRequestError {
  "pathNotFound" = "pathNotFound",
  "missingArgs" = "missingArgs",
  "permissionDenied" = "permissionDenied",
  "internalServerError" = "internalServerError",
  "badRequest" = "badRequest",
  "notFound" = "notFound",
  "wrongContentType" = "wrongContentType",
  "quantityNotAvailable" = "quantityNotAvailable",
  "duplicateRequest" = "duplicateRequest",
}

export interface InstanceRequest {
  path?: string;
  args?: any;
  idToken?: string;
  sid?: string;
  bulk?: InstanceRequest[];
  chronological?: boolean;
}

export interface InstanceResponse {
  errors?: InstanceRequestError[];
  data?: any;
  bulk?: InstanceResponse[];
  sid?: string;
}

export interface UserToken {
  sub: string;
  email_verified: boolean;
  iss: string;
  "cognito:username": string;
  given_name: string;
  origin_jti: string;
  aud: string;
  event_id: string;
  token_use: string;
  auth_time: number;
  "custom:newsletter_consent": string;
  exp: number;
  iat: number;
  family_name: string;
  jti: string;
  email: string;
}

export interface PaymentSession {
  id: string;
  uuid?: string;
  hppSession?: string;
  paymentProvider: PaymentProvider;
  redirect?: string;
}

export interface InitCheckoutSessionArgs {
  uuid: string;
  shippingInfo: {
    shippingAddress: Address;
    billingAddress?: Address;
    shippingMethod?: ShippingMethod;
    billingAddressMatchesShippingAddress: boolean;
  };
  contactInfo: {
    privacyPolicyAccepted?: boolean;
    email: string;
    isAuthenticated?: boolean;
    username?: string;
  };
  paymentInfo: {
    paymentMethod: PaymentMethod;
  };
  lineItems: LineItemInput[];
}
