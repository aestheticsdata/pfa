require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const helmet = require('helmet');
const OS = require('os');
const cronMysql = require('./cron/cron-mysql');
const errorHandlerMiddleware = require('./utils/errorHandlerMiddleware');
const invoicesImagesBackup = require('./invoicesImagesBackup/invoicesImagesBackup');
// const rateLimiter = require('./helpers/rateLimiter');

process.env.UV_THREADPOOL_SIZE = OS.cpus().length;

app.use(helmet());
// see https://stackoverflow.com/questions/67166472/cant-remove-x-powered-by-header-in-node-express
// not very important to remve this header, see: https://github.com/expressjs/express/pull/2813#issuecomment-159270428
// removing X-Powered-By: Express is not working with :
app.use(helmet.hidePoweredBy());
// app.use(rateLimiter);
app.use(cors());

if (process.env.NODE_ENV === "production") {
  cronMysql();
}

// Bodyparser Middleware
app.use(express.json({ limit: '200kb' }));


app.use('/users', require('./routes/api/users'));
app.use('/categories', require('./routes/api/categories'));
app.use('/spendings', require('./routes/api/spendings'));
app.use('/recurrings', require('./routes/api/recurringSpendings'));
app.use('/dashboard', require('./routes/api/dashboard'));
app.use('/monthlystats', require('./routes/api/monthlybudgetstats'));
app.use('/weeklystats', require('./routes/api/weeklystats'));
app.use('/statistics', require('./routes/api/statistics'));

app.use(errorHandlerMiddleware);

const port = process.env.PORT || 6100;

const server = app.listen(port, () => console.log(`Server started on port ${port}`));
server.headersTimeout = 15_000;
server.requestTimeout = 15_000;
server.keepAliveTimeout = 15_000;
server.maxRequestsPerSocket = 100;