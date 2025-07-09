const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');

router.post('/vnpay', paymentController.createVNPayUrl);
router.get('/vnpay-return', paymentController.vnpayReturn);
router.post('/momo', paymentController.createMoMoUrl);
router.post('/momo-notify', paymentController.momoNotify);

module.exports = router; 