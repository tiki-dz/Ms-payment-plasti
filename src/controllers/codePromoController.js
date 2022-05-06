const { validationResult } = require('express-validator/check')
const { CodePromo } = require('../models')
async function addCodePromo (req, res) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).json({
      errors: errors.array(),
      success: false,
      message: 'invalid data'
    })
  }
  CodePromo.findOrCreate({
    where: {
      name: req.body.name
    },
    defaults: {
      name: req.body.name,
      idAdmin: req.body.idAdmin,
      value: req.body.value,
      startTime: req.body.startTime,
      endTime: req.body.endTime
    }
  }).then((codePromo) => {
    const [object, created] = codePromo
    if (created) {
      return res.status(200).send({ data: object, success: true, message: 'code promos' })
    } else {
      return res.status(409).send({ data: null, success: false, message: 'code promos already exist' })
    }
  })
}
async function deleteCodePromo (req, res) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).json({
      errors: errors.array(),
      success: false,
      message: 'invalid data'
    })
  }
  CodePromo.destroy({
    where: {
      idCodePromo: req.params.id// this will be your id that you want to delete
    }
  }).then(function (rowDeleted) { // rowDeleted will return number of rows deleted
    if (rowDeleted === 1) {
      return res.status(200).send({ data: null, success: true, message: 'row deleted successfully' })
    } else {
      return res.status(404).send({ data: null, success: false, message: 'row not found' })
    }
  })
}
async function patchCodePromo (req, res) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).json({
      errors: errors.array(),
      success: false,
      message: 'invalid data'
    })
  }
  CodePromo.findOne({
    where: {
      idCodePromo: req.params.id
    }
  }).then((code) => {
    if (!code) {
      return res.status(404).send({ data: null, success: false, message: 'row not found' })
    } else {
      code.name = req.body.name ?? code.name
      code.idAdmin = req.body.idAdmin ?? code.idAdmin
      code.value = req.body.value ?? code.value
      code.startTime = req.body.startTime ?? code.startTime
      code.endTime = req.body.endTime ?? code.endTime
      code.save().then((codePromo) => {
        return res.status(200).send({ data: codePromo, success: true, message: 'row updated successfully' })
      })
    }
  })
}
async function getCodePromo (req, res) {
  CodePromo.findAll().then((codes) => {
    return res.status(200).send({ data: codes, success: true, message: 'code promos' })
  })
}
async function checkCodePromo (req, res) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).json({
      errors: errors.array(),
      success: false,
      message: 'invalid data'
    })
  }
  CodePromo.findOne({
    where: {
      name: req.body.name
    }
  }).then((code) => {
    if (!code) {
      return res.status(404).send({ data: null, success: false, message: 'row not found' })
    } else {
      return res.status(200).send({ data: { newPrice: (req.body.price) - (code.value / 100) * req.body.price }, success: true, message: 'code promo applied successfully' })
    }
  })
}

module.exports = { addCodePromo, deleteCodePromo, patchCodePromo, getCodePromo, checkCodePromo }
