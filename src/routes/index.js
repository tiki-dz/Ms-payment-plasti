const express = require('express')
const router = express.Router()
const PaymentRoutes = require('./paymentRoutes')
const CodePromoRoutes = require('./codePromoRoutes')
router.get('/index', (req, res) => {
  res.send('3000')
})
router.use('/payment', PaymentRoutes)
router.use('/admin/codepromo', CodePromoRoutes)
module.exports = router
