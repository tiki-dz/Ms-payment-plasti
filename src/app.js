
const express = require('express')
const cookieParser = require('cookie-parser')
const logger = require('morgan')

const app = express()

// view engine setup
app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
const bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({ extended: true }))

// parse application/json
app.use(bodyParser.json())
app.listen(5003)
module.exports = app
console.log('server start on port 5003')
