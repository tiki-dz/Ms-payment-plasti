
const { body, param } = require('express-validator')

exports.validate = (method) => {
  switch (method) {
    case 'getPurchases': {
      return [
        param('id').isInt()
      ]
    }
    case 'purchase': {
      return [
        body('data').isEmpty(),
        body('event').isEmpty(),
        body('idClient').isInt(),
        body('codePromo').isLength({ min: 5 })
      ]
    }
    case 'saveEvent': {
      return [
        body('idClient').isInt(),
        body('idEvent').isInt()
      ]
    }
  }
}
