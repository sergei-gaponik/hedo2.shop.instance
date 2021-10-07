export enum InstanceRequestError {
  "pathNotFound" = "pathNotFound",
  "missingArgs" = "missingArgs",
  "permissionDenied" = "permissionDenied",
  "internalServerError" = "internalServerError",
  "badRequest" = "badRequest",
  "notFound" = "notFound",
  "wrongContentType" = "wrongContentType",
  "quantityNotAvailable" = "quantityNotAvailable"
}

export interface InstanceRequest {
  path?: string
  args?: any
  idToken?: string
  bulk?: InstanceRequest[]
}

export interface InstanceResponse {
  errors?: InstanceRequestError[]
  data?: any
  bulk?: InstanceResponse[]
}

export interface UserToken {
  sub: string,
  email_verified: boolean,
  iss: string,
  'cognito:username': string,
  given_name: string,
  origin_jti: string,
  aud: string,
  event_id: string,
  token_use: string,
  auth_time: number,
  'custom:newsletter_consent': string,
  exp: number,
  iat: number,
  family_name: string,
  jti: string,
  email: string
}