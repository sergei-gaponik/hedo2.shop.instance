import Stripe from 'stripe'
import { PaymentProvider } from '@sergei-gaponik/hedo2.lib.models'
import { gqlHandler } from '@sergei-gaponik/hedo2.lib.util'
import { InitCheckoutSessionArgs, PaymentSession } from '../types'
import { getShippingCost, getSubTotal } from '../util/checkout'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2020-08-27' })

export async function initStripePaymentSession(args: InitCheckoutSessionArgs): Promise<PaymentSession> {

  const subTotal = getSubTotal(args.lineItems)
  const shippingCost = getShippingCost(args.shippingInfo.shippingMethod, args.lineItems)

  const session = await stripe.checkout.sessions.create({
    customer_email: args.contactInfo.email,
    client_reference_id: args.contactInfo.username || undefined,
    line_items: [
      {
        name: "Zwischensumme",
        amount: Math.round(subTotal * 100),
        currency: "EUR",
        quantity: 1
      },
      {
        name: "Versandkosten",
        amount: Math.round(shippingCost * 100),
        currency: "EUR",
        quantity: 1
      }
    ],
    payment_method_types: ['card'],
    mode: 'payment',
    success_url: `${process.env.SHOP_DOMAIN}/checkout/success?sid={CHECKOUT_SESSION_ID}&p=stripe`,
    cancel_url: `${process.env.SHOP_DOMAIN}/checkout`,
  })

  return {
    id: session.id,
    redirect: session.url,
    paymentProvider: PaymentProvider.stripe
  }
}

export async function completeStripePaymentSession(sessionId: string){

  const session = await stripe.checkout.sessions.retrieve(sessionId)

  if(session.payment_status == "paid"){

    const setOrderPaid = `
      mutation SetOrderPaid($paymentSessionId: String!){
        setOrderStatusPaid(filter: {
          paymentSessionId: $paymentSessionId
        }){
          errors
        }
      }
    `

    const r = await gqlHandler({
      query: setOrderPaid,
      variables: { paymentSessionId: sessionId }
    })

    if(r.errors?.length || !r.data.setOrderStatusPaid || r.data.setOrderStatusPaid.errors?.length)
      return false;
    else
      return true;
  }

  return false;
}