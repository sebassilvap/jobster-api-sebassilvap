const express = require('express');
const router = express.Router();

const authenticateUser = require('../middleware/authentication');
const testUser = require('../middleware/testUser'); //! Restrict CRUD on Test User

const rateLimiter = require('express-rate-limit');

// to limit the # of times somebody wants to create an account or login
const apiLimiter = rateLimiter({
  windowsMs: 15 * 60 * 1000,
  max: 10,
  message: {
    msg: 'Too many requests from this IP, please try again after 15 minutes!',
  },
});

const { register, login, updateUser } = require('../controllers/auth');

router.post('/register', apiLimiter, register); //! api limiter
router.post('/login', apiLimiter, login); //! api limiter

router.patch('/updateUser', authenticateUser, testUser, updateUser); //! Restrict CRUD on Test User

module.exports = router;
