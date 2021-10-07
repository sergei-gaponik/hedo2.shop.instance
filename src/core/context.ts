import * as urql from "@urql/core"
import { Db } from "mongodb"

export interface Context {
  mongoDB?: Db,
}

let _context = {}


export const setContext = (context: Context) => {
  _context = Object.assign(_context, context)
}
export const context = (): Context => _context