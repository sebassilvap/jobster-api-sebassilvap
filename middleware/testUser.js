//? To restrict the CRUD operations to the Test User
const { BadRequestError } = require('../errors');

const testUser = (req, res, next) => {
  if (req.user.testUser) {
    throw new BadRequestError('Test User. Read Only!');
  }

  next();
};

module.exports = testUser;
