const { validationResult } = require('express-validator/check')
const { CodePromo } = require('../models')
const { Op } = require('sequelize')
const { getAdminByToken } = require('../utils/communication')
async function addCodePromo (req, res) {
  const errors = validationResult(req)
  console.log(errors)
  if (!errors.isEmpty()) {
    return res.status(422).json({
      errors: errors.array(),
      success: false,
      message: 'invalid data'
    })
  }
  const adminObject = await getAdminByToken(req.headers['x-access-token'])
  if (!adminObject) {
    return res
      .status(500)
      .send({ success: false, message: 'code promos failed' })
  }
  CodePromo.findOrCreate({
    where: {
      name: req.body.name
    },
    defaults: {
      name: req.body.name,
      use: req.body.use,
      idAdmin: adminObject.data.Administrator.idAdmin,
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
  const { page, size } = req.query
  const { limit, offset } = getPagination(page, size)
  CodePromo.findAndCountAll({
    offset: offset,
    limit: limit
  }).then((codes) => {
    const response = getPagingData(codes, page, limit)
    return res
      .status(200)
      .send({ data: response, success: true, message: 'code promos' })
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
      name: req.body.name,
      endTime: { [Op.gte]: new Date() },
      startTime: { [Op.lte]: new Date() }
    }
  }).then((code) => {
    if (!code) {
      return res
        .status(404)
        .send({ data: null, success: false, message: 'row not found' })
    } else {
      return res
        .status(200)
        .send({
          data: {
            newPrice: req.body.price - (code.value / 100) * req.body.price
          },
          success: true,
          message: 'code promo applied successfully'
        })
    }
  })
}
const getPagingData = (data, page, limit) => {
  const { count: totalItems, rows: codes } = data
  const currentPage = page ? +page : 0
  const totalPages = Math.ceil(totalItems / limit)
  return { totalItems, codes, totalPages, currentPage }
}
const getPagination = (page, size) => {
  const limit = size ? +size : 5
  const offset = page ? page * limit : 0
  return { limit, offset }
}
module.exports = { addCodePromo, deleteCodePromo, patchCodePromo, getCodePromo, checkCodePromo }
