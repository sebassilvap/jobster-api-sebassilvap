const express = require('express');

const testUser = require('../middleware/testUser'); //! Restrict CRUD on Test User

const router = express.Router();
const {
  createJob,
  deleteJob,
  getAllJobs,
  getJob,
  showStats,
  updateJob,
} = require('../controllers/jobs');

router.route('/').post(testUser, createJob).get(getAllJobs);

//! for STATS page
router.route('/stats').get(showStats);

router
  .route('/:id')
  .get(getJob)
  .delete(testUser, deleteJob) //! Restrict CRUD on Test User
  .patch(testUser, updateJob); //! Restrict CRUD on Test User

module.exports = router;
