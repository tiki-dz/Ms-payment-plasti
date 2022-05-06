const express = require('express')
const router = express.Router()
const paymentController = require('../controllers/paymentController')
const validation = require('../validation/validation')
router.post('/purchase', validation.validate('purchase'), paymentController.purchase)
router.post('/webhook', paymentController.webhook)
router.post('/saveEvent', validation.validate('saveEvent'), paymentController.saveEvent)
router.post('/unsaveEvent', validation.validate('saveEvent'), paymentController.unsaveEvent)
router.get('/:id/purchases', validation.validate('getPurchases'), paymentController.getPurchasesByClient)
router.get('/purchases', paymentController.getAllPurchases)

module.exports = router
