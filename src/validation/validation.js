/* eslint-disable */

const { body, param } = require('express-validator/check')

exports.validate = (method) => {
  switch (method) {
    case 'addCodePromo': {
      return [
    body('name', 'Invalid value min length 1').isLength({ min: 1, max:10  }),
        body('idAdmin').isInt(),
        body('value').isInt({ min: 1, max: 99 }),
        body('startTime').isISO8601().toDate(),
        body('endTime').isISO8601().toDate(),

      ]
    }
    case 'patchCodePromo': {
      return [
        param('id').isInt(),
        body('name', 'Invalid value min length 1').optional().isLength({ min: 1 }),
        body('value').optional().isInt(),
        body('startTime').optional().isISO8601().toDate(),
        body('endTime').optional().isISO8601().toDate()
      ]
    }
    case 'deleteCodePromo': {
      return [
        param('id').isInt()
      ]
    }
    case 'checkCodePromo': {
      return [
        body('name').isLength({ min: 1, max: 10 }),
        body('price').isInt(),
      ]
    }
  }
}
