export const VERSION = require("../../package.json").version
export const PRODUCTION = process.env.NODE_ENV == "production"
export const DEFAULT_VAT = 0.19
export const LIMIT_MAX = 100
export const ARRAY_MAX = 100