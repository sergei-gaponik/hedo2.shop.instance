import { context } from '../core/context'
import { InstanceRequestError, InstanceResponse } from '../types';
import { isValidStringArray, isValidProjection , gqlHandler} from '@sergei-gaponik/hedo2.lib.util'
import validateToken from '../util/validateToken'
import { createUser } from '../util/user'
import { Address } from '@sergei-gaponik/hedo2.lib.models'


const _getUserAddresses = async (user): Promise<InstanceResponse> => {

  const getUserAddresses = `
    query GetUserAddresses($username: String!){
      user(filter: { username: $username }){
        _id
        addresses {
          hash
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
          defaultShippingAddress
          defaultBillingAddress
        }
      }
    }
  `

  const r = await gqlHandler({
    endpoint: process.env.SYSTEM_API_ENDPOINT,
    query: getUserAddresses,
    variables: { username: user.sub }
  })

  if(r.errors)
    return { errors: [ InstanceRequestError.internalServerError ]}

  if(r.data.user){
    return { data: { addresses: r.data.user.addresses }}
  }
  else{
    await createUser(user)
    return { data: { addresses: [] }}
  }
}

const _updateUserAddresses = async (username, addresses): Promise<InstanceResponse> => {

  const updateUserAddresses = `
      mutation UpdateUserAddresses($username: String!, $addresses: [AddressInput!]!){
        updateOneUser(filter: { username: $username }, input: { addresses: $addresses }){
          errors
        }
      }
    `
  
  const r2 = await gqlHandler({
    endpoint: process.env.SYSTEM_API_ENDPOINT,
    query: updateUserAddresses,
    variables: { username, addresses }
  })

  if(r2.errors?.length || r2.data.updateOneUser.errors?.length)
    return { errors: [ InstanceRequestError.internalServerError ]}

  return {}
}



export async function getUserAddresses(args): Promise<InstanceResponse> {

  const user = await validateToken(args?.idToken)

  if(!user)
    return { errors: [ InstanceRequestError.permissionDenied ]}

  return await _getUserAddresses(user)
}

export async function createUserAddress(args): Promise<InstanceResponse>{

  const user = await validateToken(args?.idToken)

  if(!user)
    return { errors: [ InstanceRequestError.permissionDenied ]}

  const r = await _getUserAddresses(user)

  if(r.errors?.length) return r;

  let addresses: Address[] = r.data.addresses || []

  const address: Address = args.address

  if(address.defaultBillingAddress){
    addresses.forEach(a => a.defaultBillingAddress = false)
  }
  if(address.defaultShippingAddress){
    addresses.forEach(a => a.defaultShippingAddress = false)
  }

  addresses.push(address)

  return await _updateUserAddresses(user.sub, addresses)
}

export async function updateUserAddress(args): Promise<InstanceResponse>{

  const user = await validateToken(args?.idToken)

  if(!user)
    return { errors: [ InstanceRequestError.permissionDenied ]}

  const r = await _getUserAddresses(user)

  if(r.errors?.length) return r;

  let addresses: Address[] = r.data.addresses || []

  const address: Address = args.address

  if(address.defaultBillingAddress){
    addresses.forEach(a => a.defaultBillingAddress = false)
  }
  if(address.defaultShippingAddress){
    addresses.forEach(a => a.defaultShippingAddress = false)
  }

  addresses = addresses.map(_address => _address.hash == address.hash ? address : _address)

  return await _updateUserAddresses(user.sub, addresses)

}

export async function deleteUserAddress(args): Promise<InstanceResponse>{

  const user = await validateToken(args?.idToken)

  if(!user)
    return { errors: [ InstanceRequestError.permissionDenied ]}

  const r = await _getUserAddresses(user)

  if(r.errors?.length) return r;

  let addresses: Address[] = r.data.addresses || []

  addresses = addresses.filter(_address => _address.hash != args.hash)

  return await _updateUserAddresses(user.sub, addresses)

}