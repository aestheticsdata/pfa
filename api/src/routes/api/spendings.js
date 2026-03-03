const router = require('express').Router();
const checkToken = require('./helpers/checkToken');
const uploadMiddleware = require('./helpers/customMulter');
const catchAsync = require('../../utils/catchAsync');


const getSpendingsController = require('../controllers/spendings/getSpendingsController');
const getSpendingController = require('../controllers/spendings/getSpendingController');
const getSpendingInvoiceImageController = require('../controllers/spendings/getSpendingInvoiceImageController');
const getSpendingsChartsController = require('../controllers/spendings/getSpendingsChartsController');
const postSpendingController = require('../controllers/spendings/postSpendingController');
const postSpendingInvoiceUploadController = require('../controllers/spendings/postSpendingInvoiceUploadController');
const deleteSpendingInvoiceImageController = require('../controllers/spendings/deleteSpendingInvoiceImageController');
const updateSpendingController = require('../controllers/spendings/updateSpendingController');
const deleteSpendingController = require('../controllers/spendings/deleteSpendingController');

router.get('/', checkToken, catchAsync(getSpendingsController));
router.get('/charts', checkToken, catchAsync(getSpendingsChartsController));
router.get('/upload/:id', checkToken, catchAsync(getSpendingInvoiceImageController));
router.get('/:id', checkToken, catchAsync(getSpendingController));

router.post('/', checkToken, catchAsync(postSpendingController));
router.post('/upload', [checkToken, uploadMiddleware.single('invoiceImageUpload')], catchAsync(postSpendingInvoiceUploadController));

router.delete('/upload', checkToken, catchAsync(deleteSpendingInvoiceImageController));
router.put('/:id', checkToken, catchAsync(updateSpendingController));

router.delete('/:id', checkToken, catchAsync(deleteSpendingController));

module.exports = router;
