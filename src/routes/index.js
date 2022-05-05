const express = require('express')
const router = express.Router()
const PaymentRoutes = require('./paymentRoutes')

router.get('/index', (req, res) => {
  res.send('3000')
})

router.use('/payment', PaymentRoutes)

module.exports = router
