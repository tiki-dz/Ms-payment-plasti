require('dotenv').config()
const StripeSecretKey = process.env.STRIPE_SECRET_KEY
const { SavedEvent, Purchase, MultipleTicket, CodePromo } = require('../models')
const stripe = require('stripe')(StripeSecretKey)
const { Op } = require('sequelize')
const { validationResult } = require('express-validator')
const { getEventById, getClientById, editEventById, checkTokenClient } = require('../utils/communication')
const { addScore } = require('../utils/eventsToPublishFunctions')
const ticketController = require('../controllers/ticketController')

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
    // check client Token
    const token = req.headers['x-access-token']
    const response = await checkTokenClient(token)
    if (response.success) {
      console.log('idClient:' + response.data.client.idClient)
      // check for the event if exist
      const event = await getEventById(req.body.event.id)
      let lineItemsArray = []
      // event exists , checking if available
      if (event.success) {
        const data = req.body.data
        const codePromo = req.body.codePromo
        if (event.data.ticketNb >= data.length + 1) {
          // update the number of available tickets
          const body = {
            sub: true,
            number: data.length + 1
          }
          const eventEdited = await editEventById({ id: req.body.event.id, body: body })
          console.log(eventEdited)
          let neweventprice = event.data.price
          if ('codePromo' in req.body) {
            console.log(new Date())
            // checking if codePromo exists and valid
            const responseCP = await CodePromo.findOne({ where: { name: codePromo, endTime: { [Op.gte]: new Date() }, startTime: { [Op.lte]: new Date() } } })

            if (responseCP === null) {
              return res.status(500).send({ errors: 'codePromo invalid', success: false, message: 'codePromo not found or not valid' })
            } else {
            // checking if is used already or not
              const count = await Purchase.count({ where: { idClient: response.data.client.idClient, CodePromoIdCodePromo: responseCP.idCodePromo } })
              if (count < responseCP.use) {
                // one ticket with codePromotion applied while others with the original price
                neweventprice = Math.floor(event.data.price * (100 - responseCP.value) / 100)
                req.body.codePromo = responseCP.idCodePromo
                lineItemsArray = [{
                  price_data: {
                    currency: 'usd',
                    product_data: {
                      name: event.data.name
                    },
                    unit_amount: event.data.price
                  },
                  quantity: data.length
                },
                {
                  price_data: {
                    currency: 'usd',
                    product_data: {
                      name: event.data.name
                    },
                    unit_amount: neweventprice
                  },
                  quantity: 1
                }]
              } else {
                return res.status(500).send({ errors: 'Code promo already used', success: false, message: 'max number of usage achieved' })
              }
            }
          } else {
            // all tickets are with the original price
            lineItemsArray = [{
              price_data: {
                currency: 'usd',
                product_data: {
                  name: event.data.name
                },
                unit_amount: event.data.price
              },
              quantity: data.length + 1
            }]
          }
          // open a session for payment
          const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            line_items: lineItemsArray,
            // sending the infos in the metadata attribute
            metadata: { infos: JSON.stringify(req.body), client: JSON.stringify(response.data.client), token: token },
            success_url: 'http://127.0.0.1:8090/home',
            cancel_url: 'http://127.0.0.1:8090/home/EventList',
            expires_at: Math.floor(Date.now() / 1000 + 3600)
          })

          res.json({ url: session.url })
        } else {
          res.status(500).send({ errors: 'Tickets Not available', success: false, message: 'Available:' + event.data.ticketNb + '/ Needed:' + (data.length + 1) })
        }
      }
    }
  } catch (error) {
    res.status(500).send({ errors: error, success: false, message: 'Purchase failed' })
    console.log(error)
  }
}
// my local webhook secret key
const endpointSecret = 'whsec_omD0hpYVYzyogWjK4vVQXKGLJ9T9Yn90'

// a webhook for the payment intents to save infos to the database
async function webhook (req, res) {
  const payload = req.body

  const sig = req.headers['stripe-signature']
  console.log(sig)
  let event
  try {
    // check if event coming from stripe by signature
    event = stripe.webhooks.constructEvent(payload, endpointSecret)
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
    console.log('data:', data)

    console.log('adding score')
    addScore(session.metadata.token, 100)
    const clientInfos = JSON.parse(session.metadata.client).User

    try {
      let codeP = null
      if ('codePromo' in data) codeP = parseInt(data.codePromo)
      const purchaseResponse = await Purchase.create({
        nbTickets: data.data.length + 1, idEvent: parseInt(data.event.id), idClient: parseInt(JSON.parse(session.metadata.client).idClient), CodePromoIdCodePromo: codeP
      })
      // here we should remove number of ticket from available
      //  console.log(purchaseResponse)
      console.log(data.data.length, clientInfos)
      //  phoneNumber: clientInfos.phoneNumber
      const client = await MultipleTicket.create({
        firstName: clientInfos.firstName, lastName: clientInfos.lastName, phoneNumber: '0123456789', PurchaseIdPurchase: purchaseResponse.idPurchase
      })
      console.log(client)
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
    // checkout.session.async_payment_failed'
  } else if (event.type === 'checkout.session.expired' || event.type === 'checkout.session.async_payment_failed') {
    const session = event.data.object
    const data = JSON.parse(session.metadata.infos)
    const eventEdited = await editEventById({
      sub: false,
      number: data.data.length + 1
    })
    console.log(eventEdited)
    return res.status(500).send({ error: 'Payment failed' })
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
    const idClient = parseInt(req.body.idClient)
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
      include: MultipleTicket
    })
    for (let i = 0; i < response.length; i++) {
      try {
        const event = await getEventById(response[i].idEvent)
        response[i].setDataValue('event', event)
        console.log(event)
        for (let k = 0; k < response[i].MultipleTickets.length; k++) {
          try {
            console.log(response[i].MultipleTickets.length)
            console.log('idticket', response[i].MultipleTickets[k].idTicket)
            const qrCode = await ticketController.GetQrCode(response[i].MultipleTickets[k].idTicket)
            console.log('qrcode: ', qrCode.data)
            response[i].MultipleTickets[k].setDataValue('qrCode', qrCode.data)
          } catch (error) {
            return res.status(500).json({
              errors: [error],
              success: false,
              message: 'Error getting qrCode'
            })
          }
        }
      } catch (error) {
        return res.status(500).json({
          errors: [error],
          success: false,
          message: 'Error getting event by id'
        })
      }
    }
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
    console.log(response[0])
    for (let i = 0; i < response.length; i++) {
      try {
        const event = await getEventById(response[i].idEvent)
        response[i].event = event.data
        const client = await getClientById(response[i].idClient, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Im4uZ3JlYmljaUBlc2ktc2JhLmR6IiwiaWF0IjoxNjUzMzA3NTcwLCJleHAiOjE2NTU4OTk1NzB9.g2jPPMWpI2nrPLNIffgTSnkFccJrJQ4NwYZaBC55tA4')
        response[i].client = client.data
      } catch (error) {
        console.log(i, response[i].idClient)
        return res.status(500).json({
          errors: [error],
          success: false,
          message: 'Error getting event by id'
        })
      }
    }
    return res.status(200).json({ data: response, success: true, message: ['purchases retrieved successfuly'] })
  } catch (error) {
    return res.status(500).json({
      errors: [error],
      success: false,
      message: 'process error'
    })
  }
}

async function getSavedEvents (req, res) {
  try {
    const Saved = []
    const idClient = req.params.id
    const response = await SavedEvent.findAll({
      where: {
        idClient: idClient
      }
    })
    for (let i = 0; i < response.length; i++) {
      try {
        const event = await getEventById(response[i].idEvent)
        Saved.push(event.data)
      } catch (error) {
        console.log(i, response[i].idClient)
        return res.status(500).json({
          errors: [error],
          success: false,
          message: 'Error getting event by id'
        })
      }
    }
    return res.status(200).json({ data: Saved, success: true, message: ['Saved events retrieved successfuly'] })
  } catch (error) {
    return res.status(500).json({
      errors: [error],
      success: false,
      message: 'process error'
    })
  }
}

module.exports = { purchase, webhook, unsaveEvent, saveEvent, getPurchasesByClient, getAllPurchases, getSavedEvents }
