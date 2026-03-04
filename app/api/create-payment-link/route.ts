import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
})

export async function POST(req: NextRequest) {
  try {
    const { invoiceId, invoiceNumber, amount, customerName, description } = await req.json()

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    // Create a Stripe Price on the fly
    const price = await stripe.prices.create({
      currency: 'usd',
      unit_amount: Math.round(amount * 100), // cents
      product_data: {
        name: `Invoice ${invoiceNumber} — Mountain Climate HVAC`,
      },
    })

    // Create a Payment Link
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [{ price: price.id, quantity: 1 }],
      metadata: {
        invoice_id: invoiceId,
        invoice_number: invoiceNumber,
        customer_name: customerName || '',
      },
      payment_intent_data: {
        metadata: {
          invoice_id: invoiceId,
          invoice_number: invoiceNumber,
        },
      },
      after_completion: {
        type: 'hosted_confirmation',
        hosted_confirmation: {
          custom_message: `Thank you for your payment! Mountain Climate HVAC — Invoice ${invoiceNumber} is now paid.`,
        },
      },
    })

    return NextResponse.json({ url: paymentLink.url, id: paymentLink.id })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Stripe error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
