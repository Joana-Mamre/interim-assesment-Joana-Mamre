const router = require('express').Router();
const { getAll, getGainers, getNew, addCrypto } = require('../controllers/cryptoController');
router.get('/', getAll);
router.get('/gainers', getGainers);
router.get('/new', getNew);
router.post('/', addCrypto);
module.exports = router;