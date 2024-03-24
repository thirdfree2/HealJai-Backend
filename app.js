const express = require('express');
const http = require('http');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const flash = require('express-flash');
const session = require('express-session');
const socketio = require('socket.io');



const indexRouter = require('./routes/index');
const adminRouter = require('./routes/admin');
const refundRouter = require('./routes/api/refund');
const getpsychonistRouter = require('./routes/api/getpsychonist');
const getappointmentRouter = require('./routes/api/getappointment');
const userRouter = require('./routes/api/getuser');

const app = express();
const httpServer= http.createServer(app);

const io = require('socket.io')(httpServer, {
  cors: {
   origin: "http://localhost:3000",
},
});

app.use(express.static('public'));
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
app.use('/psychologist', getpsychonistRouter);
app.use('/appointment', getappointmentRouter);
app.use('/admin/refund', refundRouter);
app.use('/user', userRouter);


io.on("connection",(socketio) => {
  console.log("New user connected");
  socket.on("chat message", (msg) => {
    console.log("Message from client: " + msg);
    // ส่งข้อความกลับไปยังผู้ใช้
    io.emit("chat message", msg);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
})

module.exports = app;
