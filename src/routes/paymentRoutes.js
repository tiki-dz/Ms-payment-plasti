const express = require('express')
const router = express.Router()
const paymentController = require('../controllers/paymentController')
router.post('/purchase', paymentController.purchase)
router.post('/webhook', paymentController.webhook)
router.post('/saveEvent', paymentController.saveEvent)
router.post('/unsaveEvent', paymentController.unsaveEvent)
router.get('/:id/purchases', paymentController.getPurchasesByClient)
router.get('/purchases', paymentController.getAllPurchases)

module.exports = router
