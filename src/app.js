if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}
const { sequelize } = require('./models')

const indexRouter = require('./routes/index')
const StripePublicKey = process.env.STRIPE_SECRET_KEY
const StripeSecretKey = process.env.STRIPE_PUBLIC_KEY
console.log(StripePublicKey, StripeSecretKey)
const express = require('express')
const cookieParser = require('cookie-parser')
const logger = require('morgan')

const app = express()

// view engine setup
app.use(logger('dev'))
const bodyParser = require('body-parser')
app.use('/api/payment/webhook', bodyParser.raw({ type: '*/*' }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(bodyParser.urlencoded({ extended: true }))
app.use('/api', indexRouter)

app.listen(5003)
sequelize.query('SET FOREIGN_KEY_CHECKS = 0').then(function () {
  sequelize.sync({ alter: true })
})
module.exports = app
console.log('server start on port 5003')
