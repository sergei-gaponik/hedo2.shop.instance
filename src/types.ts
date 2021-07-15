export enum InstanceRequestError {
  "pathNotFound" = "pathNotFound",
  "missingArgs" = "missingArgs",
  "permissionDenied" = "permissionDenied",
  "internalServerError" = "internalServerError",
  "badRequest" = "badRequest",
  "notFound" = "notFound",
  "wrongContentType" = "wrongContentType"
}

export interface InstanceRequest {
  path?: string
  args?: any
}

export interface InstanceResponse {
  errors?: InstanceRequestError[]
  data?: any
}