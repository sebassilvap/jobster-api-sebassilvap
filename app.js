require('dotenv').config();
require('express-async-errors');

const path = require('path');

// extra security packages
const helmet = require('helmet');
//const cors = require('cors'); //! CORS was for external apps using our API, in this case we'll use our own Frontend
const xss = require('xss-clean');
//const rateLimiter = require('express-rate-limit'); //! REMOVE THIS ! - we'll set a very exclusive limiter for login and register

// Swagger
/*//! REMOVE THIS - WE'LL WORK WITH THE FRONTEND
const swaggerUI = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./swagger.yaml');
*/

const express = require('express');
const app = express();

const connectDB = require('./db/connect');
const authenticateUser = require('./middleware/authentication');
// routers
const authRouter = require('./routes/auth');
const jobsRouter = require('./routes/jobs');
// error handler
const notFoundMiddleware = require('./middleware/not-found');
const errorHandlerMiddleware = require('./middleware/error-handler');

//! This one is for the DEPLOYMENT
app.set('trust proxy', 1);

/*//! REMOVE THIS ! - we'll set a very exclusive limiter for login and register
app.set('trust proxy', 1);
app.use(
  rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  })
);
*/

app.use(express.static(path.resolve(__dirname, './client/build')));

app.use(express.json());
app.use(helmet());
//app.use(cors()); //! CORS was for external apps using our API, in this case we'll use our own Frontend
app.use(xss());

/*//! REMOVE THIS - WE'LL WORK WITH THE FRONTEND
app.get('/', (req, res) => {
  res.send('<h1>Jobs API</h1><a href="/api-docs">Documentation</a>');
});
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocument));
*/

// routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/jobs', authenticateUser, jobsRouter);

// serve my frontend for any other route -> after the api routes
// serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, './client/build', 'index.html'));
});

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const port = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`)
    );
  } catch (error) {
    console.log(error);
  }
};

start();
