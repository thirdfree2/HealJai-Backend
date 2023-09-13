var express = require("express");
var router = express.Router();
let dbCon = require("../../lib/db");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

router.get('/get', (req, res) => {
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
  

  router.post('/login', (req, res) => {
    const { user_email, user_password } = req.body;
  
    if (!user_email || !user_password) {
      return res.status(400).json({ message: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' });
    }
    
    const query = 'SELECT * FROM user_table WHERE user_email = ?';
  
    dbCon.query(query, [user_email], async (err, results) => {
      if (err) {
        console.error('เกิดข้อผิดพลาดในการค้นหาข้อมูล admin: ' + err.message);
        return res.status(500).json({ message: 'มีข้อผิดพลาดในการล็อกอิน' });
      }
  
      if (results.length === 0) {
        return res.status(401).json({ message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
      }
  
      const userData = results[0];
  
      // ตรวจสอบรหัสผ่าน
      try {
        const isPasswordCorrect = await bcrypt.compare(user_password, userData.user_password);
        if (!isPasswordCorrect) {
          return res.status(401).json({ message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
        }
  
        const token = jwt.sign({ email: userData.user_email }, 'shhhhh', { expiresIn: '1h' });
        res.status(200).json({ status: true, success: "sendData", token: token });
      } catch (bcryptErr) {
        console.error('เกิดข้อผิดพลาดในการเปรียบเทียบรหัสผ่าน: ' + bcryptErr.message);
        return res.status(500).json({ message: 'มีข้อผิดพลาดในการล็อกอิน' });
      }
    });
  });


router.post('/auth', (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    console.log(token)
    var decoded = jwt.verify(token, 'shhhhh');
    res.json({ status: 'ok', decoded });
  } catch (error) {
    console.log(token)
    res.json({ status: 'error', msg: error.message , token});
  }
});


router.post('/register', async (req, res) => {
    const { user_password, user_email, user_phone, user_name } = req.body;
    // Check if the 'password' field is missing or null/empty
    if (!user_password) {
      return res.status(400).json({ message: "Password is required" });
    }
    try {
      const hashedPassword = await bcrypt.hash(user_password, 10);
      dbCon.query(
        "INSERT INTO user_table(user_password, user_email, user_phone, user_name) VALUES(?,?,?,?)",
        [hashedPassword, user_email, user_phone, user_name],
        (err, results, fields) => {
          if (err) {
            console.log("Error : ", err);
            return res.status(400).send();
          }
        return res.status(201).json({ message: 'Success'});
        }
      );
    } catch (err) {
      console.log(err);
      return res.status(500).send();
    }
  });

module.exports = router;