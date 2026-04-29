const router = require('express').Router();
const protect = require('../middleware/authMiddleware');
const { getProfile } = require('../controllers/userController');
router.get('/', protect, getProfile);
module.exports = router;