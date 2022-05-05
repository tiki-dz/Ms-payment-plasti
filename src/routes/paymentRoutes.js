const express = require('express')
const router = express.Router()
const paymentController = require('../controllers/paymentController')
router.post('/purchase', paymentController.purchase)
router.post('/webhook', paymentController.webhook)
router.post('/saveEvent', paymentController.saveEvent)
router.post('/unsaveEvent', paymentController.unsaveEvent)
module.exports = router
