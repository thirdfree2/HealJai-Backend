const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const flash = require('express-flash');
const session = require('express-session');
const dbCon = require("./lib/db");

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');


const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const psychonistRouter = require('./routes/psychonist');
const exp = require('constants');

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
app.use('/users', usersRouter);
app.use('/psychonist', psychonistRouter);

const secretKey = 'your_secret_key';


// Middleware to verify the token
function verifyToken(req, res, next) {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(401).json({ message: 'Token not provided' });
  }

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.userId = decoded.user_id;
    next();
  });
}

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

app.get('/getuser', (req, res) => {
  dbCon.query('SELECT * FROM user_table', (error, results, fields) => {
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


//sign up
app.post('/registion', async (req, res) => {
  const { user_password, user_email, user_phone, user_name } = req.body;

  // Check if the 'password' field is missing or null/empty
  if (!user_password) {
    return res.status(400).json({ message: "Password is required" });
  }

  try {

    const hashedPassword = await bcrypt.hash(user_password, 10);

    dbCon.query(
      "INSERT INTO user_phone(user_password, user_email, user_phone, user_name) VALUES(?,?,?,?)",
      [hashedPassword, user_email, user_phone, user_name],
      (err, results, fields) => {
        if (err) {
          console.log("Error : ", err);
          return res.status(400).send();
        }
        return res.status(201).json({ message: "Success" });
      }
    );
  } catch (err) {
    console.log(err);
    return res.status(500).send();
  }
});


app.post('/login', async (req, res) => {
  const { user_name, user_password } = req.body;

  try {
    dbCon.query(
      'SELECT * FROM user_phone WHERE user_name = ?',
      [user_name],
      async (err, results, fields) => {
        if (err) {
          console.error('Error:', err);
          return res.status(400).send();
        }

        if (results.length === 0) {
          return res.status(401).json({ message: 'User not found' });
        }

        const user = results[0];
        const passwordMatch = await bcrypt.compare(user_password, user.user_password);

        if (!passwordMatch) {
          return res.status(401).json({ message: 'Invalid password' });
        }

        // Generate a JWT token upon successful login
        const token = jwt.sign({ user_id: user.id }, secretKey, { expiresIn: '1h' });

        return res.status(200).json({ message: 'Login successful', token });
      }
    );
  } catch (err) {
    console.error(err);
    return res.status(500).send();
  }
});



app.post('/registionaddmin', async (req, res) => {
  const { admin_password, admin_email,admin_user } = req.body;

  // Check if the 'password' field is missing or null/empty
  if (!admin_password) {
    return res.status(400).json({ message: "Password is required" });
  }

  try {

    const hashedPassword = await bcrypt.hash(admin_password, 10);

    dbCon.query(
      "INSERT INTO admin_table(admin_password, admin_email,admin_user) VALUES(?,?,?)",
      [hashedPassword, admin_email, admin_user],
      (err, results, fields) => {
        if (err) {
          console.log("Error : ", err);
          return res.status(400).send();
        }
        return res.status(201).json({ message: "Success" });
      }
    );
  } catch (err) {
    console.log(err);
    return res.status(500).send();
  }
});



app.post('/adminlogin', async (req, res) => {
  const { admin_user, admin_password } = req.body;

  try {
    dbCon.query(
      'SELECT * FROM admin_table WHERE admin_user = ?',
      [admin_user],
      async (err, results, fields) => {
        if (err) {
          console.error('Error:', err);
          return res.status(400).send();
        }

        if (results.length === 0) {
          return res.status(401).json({ message: 'admin not found' });
        }

        const admin = results[0];
        const passwordMatch = await bcrypt.compare(admin_password, admin.admin_password);

        if (!passwordMatch) {
          return res.status(401).json({ message: 'Invalid password' });
        }

        // Generate a JWT token upon successful login
        const token = jwt.sign({ admin_id: admin.id }, secretKey, { expiresIn: '1h' });

        return res.redirect('/psychonist');
      }
    );
  } catch (err) {
    console.error(err);
    return res.status(500).send();
  }
});


app.post('/paymentrequest', async (req, res) => {
  const { 	user_name	,doc_name	,appoint_time ,payment } = req.body;

  try {


    dbCon.query(
      "INSERT INTO payment_table(user_name	,doc_name	,appoint_time ,payment) VALUES(?,?,?,?)",
      [user_name	,doc_name	,appoint_time ,payment],
      (err, results, fields) => {
        if (err) {
          console.log("Error : ", err);
          return res.status(400).send();
        }
        return res.status(201).json({ message: "Success" });
      }
    );
  } catch (err) {
    console.log(err);
    return res.status(500).send();
  }
});

module.exports = app;
