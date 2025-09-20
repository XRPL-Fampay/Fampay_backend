const path = require('path');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const requestLogger = require('./middleware/requestLogger');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const rootRouter = require('./routes/index');
const apiRouter = require('./routes/api');
const healthRouter = require('./routes/health');
const docsRouter = require('./routes/docs');

const app = express();

app.set('trust proxy', 1);

app.use(requestLogger());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/health', healthRouter);
app.use('/docs', docsRouter);
app.use('/api', apiRouter);
app.use('/', rootRouter);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
