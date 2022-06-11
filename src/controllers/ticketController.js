const { getEventById } = require('../utils/communication')

const { MultipleTicket, Purchase } = require('../models')
const jwt = require('jsonwebtoken')

async function getQrCode (req, res) {
  const id = req.params.id
  try {
    const ticket = await MultipleTicket.findOne({
      where: {
        idTicket: id
      },
      include: Purchase
    })
    // console.log(ticket)
    if (ticket) {
      try {
        const event = await getEventById(ticket.Purchase.idEvent)
        const infos = { lastName: ticket.lastName, firstName: ticket.firstName, eventName: event.data.name, time: ticket.createdAt }

        const token = jwt.sign({ ticket: infos }, process.env.JWT_TICKET_KEY, {
          expiresIn: '30d'
        })
        res.status(200).json({ data: token, success: true, message: ['qr code checked successfuly'] })
        console.log(infos)
      } catch (error) {
        res.status(404).json({ data: event, success: true, message: ['event not found'] })
      }
    } else {
      res.status(404).json({ data: ticket, success: true, message: ['ticket not found'] })
    }
  } catch (error) {
    return res.status(500).json({
      errors: [error],
      success: false,
      message: 'process error'
    })
  }
}
async function checkQrCode (req, res) {
  try {
    const qrcode = req.headers['x-access-token']
    const decoded = jwt.verify(qrcode, process.env.JWT_TICKET_KEY)
    console.log(decoded)
    const ticket = await MultipleTicket.findOne({
      where: {
        firstName: decoded.ticket.firstName,
        lastName: decoded.ticket.lastName,
        createdAt: decoded.ticket.time
      },
      include: Purchase
    })
    if (ticket) {
      try {
        console.log(ticket)
        const event = await getEventById(ticket.Purchase.idEvent)
        if (event.data.name === decoded.ticket.eventName) {
          const infos = { lastName: ticket.lastName, firstName: ticket.firstName, eventName: event.data.name, time: ticket.createdAt }
          return res.status(200).json({ data: infos, success: true, message: 'success' })
        }
        res.status(404).json({ data: { found: decoded.ticket.eventName, original: event.data.name }, success: false, message: ['event name mismatch'] })
      } catch (error) {
        res.status(404).json({ data: event, success: false, message: ['event not found'] })
      }
    }
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'error',
      errors: [err]
    })
  }
}

module.exports = { getQrCode, checkQrCode }
