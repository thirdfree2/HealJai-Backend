const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const flash = require('express-flash');
const session = require('express-session');

const indexRouter = require('./routes/index');
const adminRouter = require('./routes/admin');
const getpsychonistRouter = require('./routes/api/getpsychonist');
const getappointmentRouter = require('./routes/api/getappointment');
const userRouter = require('./routes/api/getuser');

const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  cookie: { maxAge: 60000 },
  store: new session.MemoryStore(),
  saveUninitialized: true, // Set to true without quotes
  secret: 'secret'
}));

app.use(flash());


app.use('/', indexRouter);
app.use('/admin', adminRouter);
app.use('/getpsychonist', getpsychonistRouter);
app.use('/getappointment', getappointmentRouter);
app.use('/user', userRouter);


module.exports = app;
