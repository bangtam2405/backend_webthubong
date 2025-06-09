const express = require('express');
const router = express.Router();
const partController = require('../controllers/part.controller');

router.get('/', partController.getAllParts);

module.exports = router;
