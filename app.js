const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const flash = require('express-flash');
const session = require('express-session');
const bcrypt = require('bcrypt');
const dbCon = require("./lib/db");

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const psychonistRouter = require('./routes/psychonist');

const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

const jwt = require('jsonwebtoken');
// Replace 'your-secret-key' with your actual secret key
const secretKey = process.env.JWT_SECRET || 'your-secret-key';


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
app.use('/users', usersRouter);
app.use('/psychonist', psychonistRouter);

// Get psychologists
app.get('/getpsychonist', (req, res) => {
  dbCon.query('SELECT * FROM doc_user_table', (error, results, fields) => {
    if (error) {
      console.error('Error while fetching psychologists from the database:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (results === undefined || results.length === 0) {
      return res.json({ error: false, data: [], message: 'Empty' });
    }

    return res.json({ error: false, data: results, message: 'Success' });
  });
});

// User registration
app.post('/signup', async (req, res) => {
  const { user_name, user_email, user_password, user_phone } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(user_password, 10); // Hash the user's password

    dbCon.query(
      'INSERT INTO user_table (user_name, user_email, user_password, user_phone) VALUES (?, ?, ?, ?)',
      [user_name, user_email, hashedPassword, user_phone],
      (err, results) => {
        if (err) {
          console.error('Error while inserting a user into the database:', err);
          return res.status(400).json({ error: 'Registration failed' });
        }

        console.log('User registered successfully');
        return res.status(201).json({ message: 'New user successfully registered' });
      }
    );
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});





module.exports = app;
