const { AUTH_BINDING_KEY } = require('../config/config.js')
const rabbitMq = require('./index.js')

function addScore (token, score) {
  const channel = rabbitMq.channel
  const payload = { token: token, score: score }
  const message = [{ event: 'ADD-SCORE', payload: payload }]
  rabbitMq.PublishMessage(channel, AUTH_BINDING_KEY, message)
}

module.exports = { addScore }
