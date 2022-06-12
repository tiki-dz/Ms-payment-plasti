const { Purchase, CodePromo } = require('../models')
const { Op } = require('sequelize')
const Comunication = require('../utils/communication')
const { STATISTIC_BINDING_KEY } = require('../config/config.js')
const rabbitMq = require('../utils')

async function update (req, res) {
  try {
    // TODO can be more dynamic here
    const dateFrom = new Date(new Date().setDate(new Date().getDate() - 31))
    const dateTo = new Date(new Date().setDate(new Date().getDate() - 30))
    console.log(dateFrom)
    const data = await Purchase.findAll({
      where: {
        createdAt: {
          [Op.gte]: dateFrom,
          // [Op.lt]: new Date()
          [Op.lt]: dateTo
        }
      },
      include: [{ model: CodePromo }]
    })
    let income = 0
    let totalPurchase = 0
    for (let index = 0; index < data.length; index++) {
      const element = data[index]
      // TODO some optimisation in future
      const event = await Comunication.getEventById(element.idEvent)
      let tPrice = 0
      if (event.data.price != null) {
        if (element.CodePromo === null) {
          tPrice = event.data.price * element.nbTickets
        } else {
          tPrice = event.data.price * ((element.nbTickets - 1) + (1 - (element.CodePromo.value / 100)))
        }
      }
      income += tPrice
      totalPurchase += element.nbTickets
    }
    const channel = rabbitMq.channel
    const payload = { income: income, totalPurchase: totalPurchase, date: dateFrom }
    const message = [{ event: 'ADD-PURCHASE-STAT', payload: payload }]
    rabbitMq.PublishMessage(channel, STATISTIC_BINDING_KEY, message)
    console.log('published new event')
    return res.status(200).send({ success: true, message: 'success' })
  } catch (error) {
    return res.status(500).send({ error: error, success: false, message: 'processing err' })
  }
}

module.exports = { update }
