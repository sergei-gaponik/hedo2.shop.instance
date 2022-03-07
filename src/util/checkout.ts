import { ShippingMethod, PaymentMethod, PaymentProvider, LineItemInput } from '@sergei-gaponik/hedo2.lib.models'
import { DEFAULT_VAT } from '../core/const'
import { context } from '../core/context'

export function getSubTotal(lineItems: LineItemInput[]): number{
  return lineItems.reduce((acc, cur) => acc + (cur.price * cur.quantity), 0)
}

export function getShippingCost(shippingMethod: ShippingMethod, lineItems: LineItemInput[]): number{
  if(shippingMethod.freeShippingMin != null && shippingMethod.freeShippingMin < getSubTotal(lineItems))
    return 0
  else 
    return parseFloat(shippingMethod.price as any)
}

export async function getTotalVat(lineItems: LineItemInput[]): Promise<number>{

  const variants = await context().mongoDB.collection("variants").find({ _id: { $in: lineItems.map(a => a.variant)} }).toArray()

  const totalVat =  lineItems.reduce((acc, cur) => {

    const variant = variants.find(a => a._id == cur.variant)
    const vat = variant.specialTaxRate || DEFAULT_VAT

    return acc + cur.price * vat * cur.quantity
  }, 0)

  return Math.round(totalVat * 100) / 100
}

export function paymentProviderFromPaymentMethod(paymentMethod: PaymentMethod): PaymentProvider {
  switch(paymentMethod){
    case PaymentMethod.amazonpay:
      return PaymentProvider.amazonpay
    case PaymentMethod.creditcard:
      return PaymentProvider.stripe
    case PaymentMethod.paylater:
      return PaymentProvider.klarna
    case PaymentMethod.sofort:
      return PaymentProvider.klarna
    case PaymentMethod.paypal:
      return PaymentProvider.paypal
  }
}