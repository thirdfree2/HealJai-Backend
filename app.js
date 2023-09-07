const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const flash = require('express-flash');
const session = require('express-session');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const util = require('util'); // Import the util module

const dbCon = require("./lib/db");

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const psychonistRouter = require('./routes/psychonist');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  cookie: { maxAge: 60000},
  store: new session.MemoryStore,
  saveUninitialized: 'true',
  secret: 'secret'
}))

app.use(flash());
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/psychonist', psychonistRouter)




// get psychonist
app.get('/getpsychonist',(req,res) => {
  dbCon.query('SELECT * FROM doc_user_table', (error, results, fields) => {
      if(error) throw error;
      let message = ""
      if(results === undefined || results.length == 0){
          message = "Empty";
      } else {
          message = "Success";
      }
      return res.send({error: false, data:results, message:message})
  })
})

app.get('/user',(req,res) => {
  dbCon.query('SELECT * FROM user_table', (error, results, fields) => {
      if(error) throw error;
      let message = ""
      if(results === undefined || results.length == 0){
          message = "Empty";
      } else {
          message = "Success";
      }
      return res.send({error: false, data:results, message:message})
  })
})





module.exports = app;
