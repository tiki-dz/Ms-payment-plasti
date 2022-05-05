require('dotenv').config()
const StripeSecretKey = process.env.STRIPE_SECRET_KEY
// const { Purchase, MultipleTicket } = require('../models')
const stripe = require('stripe')(StripeSecretKey)
async function purchase (req, res) {
  try {
    const data = req.body.data
    const event = req.body.event
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: event.name
          },
          unit_amount: event.price
        },
        quantity: data.length
      }],
      success_url: 'http://localhost:8090/home',
      cancel_url: 'http://localhost:8090/home'
    })

    res.json({ url: session.url })
    //   stripe.webhooks.constructEvent(req.body, sig, StripeSecretKey)
    //   stripe.charges.create({
    //     amount: total,
    //     source: token,
    //     currency: 'usd'
    //   }).then(function () {
    //     console.log('purchased successfully')
    //     return res.status(200).json({
    //       token: token,
    //       success: true,
    //       data: data
    //     })
    //   })
  } catch (error) {
    res.status(500).send({ errors: error, success: false, message: 'Purchase failed' })
    console.log(error)
  }
}
const fulfillOrder = (session) => {
  // TODO: fill me in
  console.log('Fulfilling order', session)
}
const endpointSecret = 'whsec_6d049ad54e2691e2c017292b92c2e40714d0965786b60f580c6105fb369e5ac9'
async function webhook (req, res) {
  const payload = req.body

  console.log('Got payload: ' + JSON.stringify(payload))
  const sig = req.headers['stripe-signature']
  let event
  try {
    event = stripe.webhooks.constructEvent(payload, sig, endpointSecret)
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    // Fulfill the purchase...
    fulfillOrder(session)
  }

  res.status(200)
};

// async function saveEvent (req, res) {
//   const idEvent = req.body.idEvent
//   const response = await Event
// }
// async function unsaveEvent (req, res) {
//   const idEvent = req.body.idEvent
//   const response = await clientController.unsaveEvent({ idEvent: idEvent })
// }
// get one client by id

module.exports = { purchase, webhook }
