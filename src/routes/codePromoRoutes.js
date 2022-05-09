const express = require('express')
const router = express.Router()
const codePromoController = require('../controllers/codePromoController')
const validation = require('../validation/validation')
router.post('/', validation.validate('addCodePromo'), codePromoController.addCodePromo)
router.delete('/:id', validation.validate('deleteCodePromo'), codePromoController.deleteCodePromo)
router.patch('/:id', validation.validate('patchCodePromo'), codePromoController.patchCodePromo)
router.get('/', codePromoController.getCodePromo)

router.post('/check', validation.validate('checkCodePromo'), codePromoController.checkCodePromo)
module.exports = router
