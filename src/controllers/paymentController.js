require('dotenv').config()
const StripeSecretKey = process.env.STRIPE_SECRET_KEY
const { SavedEvent, Purchase, MultipleTicket, CodePromo } = require('../models')
const stripe = require('stripe')(StripeSecretKey)
const { Op } = require('sequelize')
const { validationResult } = require('express-validator')
// open a session of payment and send the url
async function purchase (req, res) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).json({
      errors: errors.array(),
      success: false,
      message: 'invalid data'
    })
  }
  try {
    const data = req.body.data
    const event = req.body.event
    console.log(req.body)
    const codePromo = req.body.codePromo
    if ('codePromo' in req.body) {
      console.log(new Date())
      const responseCP = await CodePromo.findOne({ where: { name: codePromo, endTime: { [Op.gte]: new Date() }, startTime: { [Op.lte]: new Date() } } })

      if (responseCP === null) {
        return res.status(500).send({ errors: 'codePromo invalid', success: false, message: 'codePromo not found or not valid' })
      } else {
        const count = await Purchase.count({ where: { idClient: req.body.idClient, CodePromoIdCodePromo: responseCP.idCodePromo } })
        if (count < responseCP.use) {
          event.price = event.price * (100 - responseCP.value) / 100
          req.body.codePromo = responseCP.idCodePromo
        } else {
          return res.status(500).send({ errors: 'Code promo already used', success: false, message: 'max number of usage achieved' })
        }
      }
    }

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
      // sending the infos in the metadata attribute
      metadata: { infos: JSON.stringify(req.body) },
      success_url: 'http://localhost:8090/home',
      cancel_url: 'http://localhost:8090/home/EventList'
    })

    res.json({ url: session.url })
  } catch (error) {
    res.status(500).send({ errors: error, success: false, message: 'Purchase failed' })
    console.log(error)
  }
}
// my local webhook secret key
const endpointSecret = 'whsec_6d049ad54e2691e2c017292b92c2e40714d0965786b60f580c6105fb369e5ac9'

// a webhook for the payment intents to save infos to the database
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
    console.log('Fulfilling metadata', session)
    // getting  the infos from the metadata attribute
    const data = JSON.parse(session.metadata.infos)
    console.log(data)
    try {
      const purchaseResponse = await Purchase.create({
        nbTickets: data.data.length, idEvent: parseInt(data.event.id), idClient: parseInt(data.idClient), CodePromoIdCodePromo: parseInt(data.codePromo)
      })
      // here we should remove number of ticket from available
      console.log(purchaseResponse)
      console.log(data.data.length)
      for (let i = 0; i < data.data.length; i++) {
        console.log(data.data[i])
        await MultipleTicket.create({
          firstName: data.data[i].firstName, lastName: data.data[i].lastName, phoneNumber: data.data[i].phoneNumber, PurchaseIdPurchase: purchaseResponse.idPurchase
        })
      }
    } catch (error) {
      console.log(error)
      return res.status(500).send(`Server Error: ${error.message}`)
    }
  }
  res.sendStatus(200)
};
async function saveEvent (req, res) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).json({
      errors: errors.array(),
      success: false,
      message: 'invalid data'
    })
  }
  try {
    const idEvent = parseInt(req.body.idEvent)
    const idClient = parseInt(req.body.idClient)
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
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).json({
      errors: errors.array(),
      success: false,
      message: 'invalid data'
    })
  }
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
async function getPurchasesByClient (req, res) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).json({
      errors: errors.array(),
      success: false,
      message: 'invalid data'
    })
  }
  try {
    const idClient = req.params.id
    const response = await Purchase.findAll({
      where: {
        idClient: idClient
      },
      include: MultipleTicket,
      raw: true
    })
    return res.status(200).json({ data: response, success: true, message: ['purchases retrieved successfuly'] })
  } catch (error) {
    return res.status(500).json({
      errors: [error],
      success: false,
      message: 'process error'
    })
  }
}
async function getAllPurchases (req, res) {
  try {
    const response = await Purchase.findAll({
      include: MultipleTicket,
      // group: ['idClient'],
      raw: true
    })
    return res.status(200).json({ data: response, success: true, message: ['purchases retrieved successfuly'] })
  } catch (error) {
    return res.status(500).json({
      errors: [error],
      success: false,
      message: 'process error'
    })
  }
}

module.exports = { purchase, webhook, unsaveEvent, saveEvent, getPurchasesByClient, getAllPurchases }
