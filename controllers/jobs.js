const Job = require('../models/Job');
const { StatusCodes } = require('http-status-codes');
const { BadRequestError, NotFoundError } = require('../errors');

const mongoose = require('mongoose'); //! for STATS page
const moment = require('moment'); //! for STATS page

// =========================================================

const getAllJobs = async (req, res) => {
  //console.log(req.query); // => the query params given by the search form fields

  const { search, status, jobType, sort } = req.query;

  const queryObject = {
    createdBy: req.user.userId,
  };

  // =============
  // search field
  // =============
  if (search) {
    queryObject.position = { $regex: search, $options: 'i' }; // options:'i' => we don't care about the letter case
  }

  // ==============
  // status field
  // ==============
  if (status && status !== 'all') {
    queryObject.status = status;
  }

  // ================
  // job type field
  // ================
  if (jobType && jobType !== 'all') {
    queryObject.jobType = jobType;
  }

  //const jobs = await Job.find({ createdBy: req.user.userId }).sort('createdAt'); //? because we'll chain some values after, remove await

  let result = Job.find(queryObject);

  // ========================================
  // sort field
  // chain sort conditions
  // here we don't limit the amount of jobs
  // we just change the ORDER
  // ========================================
  if (sort === 'latest') {
    result = result.sort('-createdAt');
  }
  if (sort === 'oldest') {
    result = result.sort('-createdAt');
  }
  if (sort === 'a-z') {
    result = result.sort('position');
  }
  if (sort === 'z-a') {
    result = result.sort('-position');
  }

  // ==============================================
  // Pagination
  // We'll send back a limit of 10 jobs per page
  // ==============================================
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 30;
  const skip = (page - 1) * limit;

  result = result.skip(skip).limit(limit);

  // Please REMEMBER: once we await => we won't be able to chain anymore !!
  const jobs = await result;

  //? Because the pagination works once we make the filter and search !!!
  //? Pagination of the Backend is different to the Frontend !!!

  const totalJobs = await Job.countDocuments(queryObject); // totalJobs based on the query!
  const numOfPages = Math.ceil(totalJobs / limit); // how many pages for that query

  //res.status(StatusCodes.OK).json({ jobs, count: jobs.length }); //? refactoring after seeting up the search input!
  res.status(StatusCodes.OK).json({ jobs, totalJobs, numOfPages });
};

// =========================================================

const getJob = async (req, res) => {
  const {
    user: { userId },
    params: { id: jobId },
  } = req;

  const job = await Job.findOne({
    _id: jobId,
    createdBy: userId,
  });
  if (!job) {
    throw new NotFoundError(`No job with id ${jobId}`);
  }
  res.status(StatusCodes.OK).json({ job });
};

// =========================================================

const createJob = async (req, res) => {
  req.body.createdBy = req.user.userId;
  const job = await Job.create(req.body);
  res.status(StatusCodes.CREATED).json({ job });
};

// =========================================================

const updateJob = async (req, res) => {
  const {
    body: { company, position },
    user: { userId },
    params: { id: jobId },
  } = req;

  if (company === '' || position === '') {
    throw new BadRequestError('Company or Position fields cannot be empty');
  }
  const job = await Job.findByIdAndUpdate(
    { _id: jobId, createdBy: userId },
    req.body,
    { new: true, runValidators: true }
  );
  if (!job) {
    throw new NotFoundError(`No job with id ${jobId}`);
  }
  res.status(StatusCodes.OK).json({ job });
};

// =========================================================

const deleteJob = async (req, res) => {
  const {
    user: { userId },
    params: { id: jobId },
  } = req;

  const job = await Job.findByIdAndRemove({
    _id: jobId,
    createdBy: userId,
  });
  if (!job) {
    throw new NotFoundError(`No job with id ${jobId}`);
  }
  res.status(StatusCodes.OK).send();
};

// =========================================================
//! FOR THE STATS PAGE

const showStats = async (req, res) => {
  // =====================================
  // FOR THE DEFAULT STATS - PIPELINE
  // =====================================
  let stats = await Job.aggregate([
    { $match: { createdBy: mongoose.Types.ObjectId(req.user.userId) } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  stats = stats.reduce((acc, curr) => {
    const { _id: title, count } = curr;
    acc[title] = count;
    //? REMEMBER: always with reduce, return the accumulator
    return acc;
  }, {});

  //console.log(stats); // TEST

  //? Default Stats -> for a new user so these values are 0
  const defaultStats = {
    pending: stats.pending || 0,
    interview: stats.interview || 0,
    declined: stats.declined || 0,
  };

  // ================================================
  // FOR THE MONTHLY APPLICATIONS CHARTS - PIPELINE
  // ================================================
  let monthlyApplications = await Job.aggregate([
    { $match: { createdBy: mongoose.Types.ObjectId(req.user.userId) } },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        count: { $sum: 1 },
      },
    },
    // to get for the last 6 months from higher to lower
    { $sort: { '_id.year': -1, '_id.month': -1 } },
    // limit to last 6 months
    { $limit: 6 },
  ]);

  // iterate with map to massage the data and extract the date and # of applications
  monthlyApplications = monthlyApplications
    .map((item) => {
      const {
        _id: { year, month },
        count,
      } = item;

      // construct the new date -> using Moment.js library
      const date = moment()
        .month(month - 1)
        .year(year)
        .format('MMM Y');

      return { date, count };
    })
    .reverse();

  //console.log(monthlyApplications); //-> the last 6 months applications!

  res
    .status(StatusCodes.OK)
    //.json({ defaultStats: {}, monthlyApplications: [] }); // at the beginning
    .json({ defaultStats, monthlyApplications });
};

// =========================================================

module.exports = {
  createJob,
  deleteJob,
  getAllJobs,
  getJob,
  showStats,
  updateJob,
};
