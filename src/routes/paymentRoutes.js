const express = require('express')
const rabbitMqEvents = require('../utils/eventsToPublishFunctions.js')
const router = express.Router()
const paymentController = require('../controllers/paymentController')
const validation = require('../validation/validation')
router.post('/purchase', validation.validate('purchase'), paymentController.purchase)
router.post('/webhook', paymentController.webhook)
router.post('/saveEvent', validation.validate('saveEvent'), paymentController.saveEvent)
router.post('/unsaveEvent', validation.validate('saveEvent'), paymentController.unsaveEvent)
router.get('/:id/purchases', validation.validate('getPurchases'), paymentController.getPurchasesByClient)
router.get('/purchases', paymentController.getAllPurchases)
router.get('/:id/savedEvents', validation.validate('getPurchases'), paymentController.getSavedEvents)

router.post('/addscoreTest', function testingRabbitmq (req, res) {
  try {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImEuaGFyaXJpQGVzaS1zYmEuZHoiLCJpYXQiOjE2NTMzMDg5NzEsImV4cCI6MTY1NTkwMDk3MX0.0JTsh8CtuC2eX6lTWj6jD7TeGs0RJ9kBzQQOijNsb4c'
    rabbitMqEvents.addScore(token, 5)
    res.status(200).send('succes')
  } catch (error) {
    res.send(error)
  }
})

module.exports = router
