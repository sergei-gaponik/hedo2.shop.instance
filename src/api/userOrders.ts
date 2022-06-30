import { context } from '../core/context'
import { InstanceRequestError, InstanceResponse } from '../types';
import { isValidStringArray, isValidProjection , gqlHandler} from '@sergei-gaponik/hedo2.lib.util'
import validateToken from '../util/validateToken'
import { createUser } from '../util/user'
import { Order } from '@sergei-gaponik/hedo2.lib.models'
import Joi = require('joi');

const _getUserOrders = async (user): Promise<InstanceResponse> => {

  const getUserOrders = `
    query GetUserOrders($username: String!){
      orders(filter: { username: $username }, dereference: true){
        _id
        _created
        status
        username
        uuid
        shippingCost
        subTotal
        lineItems{
          variant{
            _id
            title
            images{
              asset{
                src
              }
            }
            measurementUnit
            measurementQuantity
          }
          product{
            _id
            name
            handle
            series{
              handle
              name
            }
            brand{
              handle
              name
            }
          }
          quantity
          price
          specialTaxRate
        }
        shippingAddress{
          firstName
          lastName
          city
          addressLine
          addressLine2
          zipCode
          country
          company
          title
          deliveryInstruction
        }
        billingAddress{
          firstName
          lastName
          city
          addressLine
          addressLine2
          zipCode
          country
          company
          title
          deliveryInstruction
        }
        billingAddressMatchesShippingAddress
        shippingMethod {
          name
          serviceProvider
          price
          freeShippingMin
          deliveryTimeFrom
          deliveryTimeTo
        }
        paymentMethod
        paymentProvider
      }
    }
  `

  const r = await gqlHandler({
    query: getUserOrders,
    variables: { username: user.sub }
  })

  if(r.errors || !r.data?.orders)
    return { errors: [ InstanceRequestError.internalServerError ]}

  return { data: { orders: r.data.orders }}
}

export async function getUserOrders(args): Promise<InstanceResponse> {

  const user = await validateToken(args?.idToken)

  if(!user)
    return { errors: [ InstanceRequestError.permissionDenied ]}

  return await _getUserOrders(user)
}
