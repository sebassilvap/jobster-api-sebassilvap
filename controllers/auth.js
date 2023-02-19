const User = require('../models/User');
const { StatusCodes } = require('http-status-codes');
const { BadRequestError, UnauthenticatedError } = require('../errors');

// =========================================================

const register = async (req, res) => {
  const user = await User.create({ ...req.body });
  const token = user.createJWT();
  //res.status(StatusCodes.CREATED).json({ user: { name: user.name }, token }); //! Refactor
  res.status(StatusCodes.CREATED).json({
    user: {
      email: user.email,
      lastName: user.lastName, // added by default on Register
      location: user.location, // added by default on Register
      name: user.name,
      token,
    },
  });
};

// =========================================================

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new BadRequestError('Please provide email and password');
  }
  const user = await User.findOne({ email });
  if (!user) {
    throw new UnauthenticatedError('Invalid Credentials');
  }
  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    throw new UnauthenticatedError('Invalid Credentials');
  }
  // compare password
  const token = user.createJWT();
  //res.status(StatusCodes.OK).json({ user: { name: user.name }, token }); //! Refactor
  res.status(StatusCodes.OK).json({
    user: {
      email: user.email,
      lastName: user.lastName, // added by default on Register
      location: user.location, // added by default on Register
      name: user.name,
      token,
    },
  });
};

// =========================================================

const updateUser = async (req, res) => {
  // test if we get these 2 values on the backend
  //   console.log(req.user);
  //   console.log(req.body);

  const { email, name, lastName, location } = req.body;

  //console.log(req.user); // TEST: to check if we are trying to update the profile of the test user

  // if one of the values is missing
  if (!email || !name || !lastName || !location) {
    throw new BadRequest('Please provide all values');
  }

  const user = await User.findOne({ _id: req.user.userId });

  // one by one change the values (they come form the frontend)
  user.email = email;
  user.name = name;
  user.lastName = lastName;
  user.location = location;

  await user.save();

  // create the token
  const token = user.createJWT;

  //res.status
  res.status(StatusCodes.OK).json({
    user: {
      email: user.email,
      lastName: user.lastName,
      location: user.location,
      name: user.name,
      token,
    },
  });
};

// =========================================================

module.exports = {
  register,
  login,
  updateUser,
};
