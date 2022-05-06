require('dotenv').config()
const StripeSecretKey = process.env.STRIPE_SECRET_KEY
const { SavedEvent, Purchase, MultipleTicket } = require('../models')
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
      metadata: { infos: JSON.stringify(req.body) },
      success_url: 'http://localhost:8090/home',
      cancel_url: 'http://localhost:8090/home'
    })

    res.json({ url: session.url })
  } catch (error) {
    res.status(500).send({ errors: error, success: false, message: 'Purchase failed' })
    console.log(error)
  }
}
const endpointSecret = 'whsec_6d049ad54e2691e2c017292b92c2e40714d0965786b60f580c6105fb369e5ac9'
async function webhook (req, res) {
  const payload = req.body

  const sig = req.headers['stripe-signature']
  console.log(sig)
  let event
  try {
    event = stripe.webhooks.constructEvent(payload, sig, endpointSecret)
  } catch (err) {
    console.log(err)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    // Fulfill the purchase...
    console.log('Fulfilling metadata', session.metadata)
    const data = JSON.parse(session.metadata.infos)
    const purchaseResponse = await Purchase.create({
      nbTickets: data.data.length, idEvent: parseInt(data.event.id), idClient: parseInt(data.idClient)
    })
    console.log(purchaseResponse)
    console.log(data.data.length)
    for (let i = 0; i < data.data.length; i++) {
      console.log(data.data[i])
      await MultipleTicket.create({
        firstName: data.data[i].firstName, lastName: data.data[i].lastName, phoneNumber: '0123456789', PurchaseIdPurchase: purchaseResponse.id
      })
    }
  }
  res.sendStatus(200)
};
async function saveEvent (req, res) {
  try {
    const idEvent = parseInt(req.body.idEvent)
    const idClient = parseInt(req.body.idEvent)
    const count = await SavedEvent.count({
      where: {
        idEvent: idEvent,
        idClient: idClient
      }
    })
    if (count === 0) {
      const response = await SavedEvent.create({ idEvent: idEvent, idClient: idClient })
      return res.status(200).json({ data: response, success: true, message: ['event saved successfuly'] })
    } else {
      return res.status(409).json({ errors: ['event already saved'], success: false, message: 'event already saved' })
    }
  } catch (error) {
    return res.status(500).json({
      errors: [error],
      success: false,
      message: 'process error'
    })
  }
}
async function unsaveEvent (req, res) {
  try {
    const idEvent = parseInt(req.body.idEvent)
    const idClient = parseInt(req.body.idEvent)
    const count = await SavedEvent.count({
      where: {
        idEvent: idEvent,
        idClient: idClient
      }
    })
    if (count !== 0) {
      const response = await SavedEvent.destroy({ where: { idEvent: idEvent, idClient: idClient } })
      return res.status(200).json({ data: response, success: true, message: ['event unsaved successfuly'] })
    } else {
      return res.status(409).json({ errors: ['event already not saved'], success: false, message: 'event not saved' })
    }
  } catch (error) {
    return res.status(500).json({
      errors: [error],
      success: false,
      message: 'process error'
    })
  }
}

module.exports = { purchase, webhook, unsaveEvent, saveEvent }
