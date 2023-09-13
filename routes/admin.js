var express = require("express");
var router = express.Router();
let dbCon = require("../lib/db");
const bcrypt = require('bcrypt');


router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
  });

router.post('/registionaddmin', async (req, res) => {
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

router.get("/dashboard", (req, res, next) => {
    dbCon.query("SELECT * FROM doc_user_table ORDER BY id desc", (err, rows) => {
      if (err) {
        req.flash("error", err);
        res.render("psychonist", { data: "" });
      } else {
        res.render("psychonist", { data: rows });
      }
    });
  });


router.post('/login', (req, res) => {
    const { admin_user, admin_password } = req.body;
  
    if (!admin_user || !admin_password) {
      return res.status(400).json({ message: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' });
    }
  
    // ค้นหาข้อมูล admin จากฐานข้อมูล
    const query = 'SELECT * FROM admin_table WHERE admin_user = ?';
  
    dbCon.query(query, [admin_user], (err, results) => {
      if (err) {
        console.error('เกิดข้อผิดพลาดในการค้นหาข้อมูล admin: ' + err.message);
        return res.status(500).json({ message: 'มีข้อผิดพลาดในการล็อกอิน' });
      }
  
      if (results.length === 0) {
        return res.status(401).json({ message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
      }
  
      const adminData = results[0];
  
      // ตรวจสอบรหัสผ่าน
      bcrypt.compare(admin_password, adminData.admin_password, (bcryptErr, bcryptResult) => {
        if (bcryptErr) {
          console.error('เกิดข้อผิดพลาดในการเปรียบเทียบรหัสผ่าน: ' + bcryptErr.message);
          return res.status(500).json({ message: 'มีข้อผิดพลาดในการล็อกอิน' });
        }
  
        if (!bcryptResult) {
          return res.status(401).json({ message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
        }
  
        // ล็อกอินสำเร็จ
        req.session.admin_user = admin_user;
        res.redirect('/admin/dashboard');
      });
    });
  });


router.get("/add", (req, res, next) => {
    const message = req.flash("error");
    res.render("psychonist/add", {
      doc_username: "",
      doc_email: "",
      doc_password: "",
      doc_phonenumber: "",
      doc_address: "",
      message: message,
    });
  });


router.post("/add", (req, res, next) => {
    let doc_username = req.body.doc_username;
    let doc_email = req.body.doc_email;
    let doc_password = req.body.doc_password;
    let doc_phonenumber = req.body.doc_phonenumber;
    let doc_address = req.body.doc_address;
    let errors = false;
  
    if (
      !doc_username ||
      !doc_email ||
      !doc_password ||
      !doc_phonenumber ||
      !doc_address
    ) {
      errors = true;
      req.flash("error", "Please fill in all fields.");
      return res.render("psychonist/add", {
        doc_username,
        doc_email,
        doc_password,
        doc_phonenumber,
        doc_address,
      });
    }
  
    if (!errors) {
      const saltRounds = 10; // จำนวนรอบในการเข้ารหัส (ค่าที่ควรจะปรับเปลี่ยนตามความต้องการ)
  
      bcrypt
        .hash(doc_password, saltRounds)
        .then((hashedPassword) => {
          let form_data = {
            doc_username: doc_username,
            doc_email: doc_email,
            doc_password: hashedPassword, // เก็บรหัสผ่านที่ถูกเข้ารหัส
            doc_phonenumber: doc_phonenumber,
            doc_address: doc_address,
          };
  
          dbCon.query("INSERT INTO doc_user_table SET ?", form_data, (err, result) => {
            if (err) {
              req.flash("error", err);
              res.render("psychonist/add", {
                doc_username: form_data.doc_username,
                doc_email: form_data.doc_email,
                doc_password: form_data.doc_password,
                doc_phonenumber: form_data.doc_phonenumber,
                doc_address: form_data.doc_address,
              });
            } else {
              req.flash('success');
              res.redirect('/admin/dashboard');
            }
          });
        })
        .catch((error) => {
          console.error("Error hashing password:", error);
          req.flash("error", "An error occurred while registering.");
          res.render("psychonist/add", {
            doc_username,
            doc_email,
            doc_password,
            doc_phonenumber,
            doc_address,
          });
        });
    }
  });

router.get('/appointment', (req, res) => {

    dbCon.query("SELECT * FROM appointment_table ORDER BY id desc", (err, rows) => {
      if (err) {
        req.flash("error", err);
        res.render("psychonist/appointment", { title: 'Appointment', data: [] });
      } else {
        // Render the "psychonist/payment" template with the retrieved data
        res.render("psychonist/appointment", { title: 'Appointment', data: rows });
      }
    });
  });
  
  
router.get('/payment', (req, res) => {
    dbCon.query("SELECT * FROM payment_table ORDER BY id desc", (err, rows) => {
      if (err) {
        req.flash("error", err);
        res.render("psychonist/payment", { title: 'Payment', data: [] });
      } else {
        // Render the "psychonist/payment" template with the retrieved data
        res.render("psychonist/payment", { title: 'Payment', data: rows });
      }
    });
  
  });


router.get('/paymentsdetails/', (req, res) => {
    const id = req.params.id; 
    const user_name = req.query.user_name;
    const doc_name = req.query.doc_name;
    const appoint_time = req.query.appoint_time;
  
    res.render('psychonist/paymentsdetails', {
      id,
      user_name,
      doc_name,
      appoint_time,
    });
  });
  

  router.post('/approve-payment', async (req, res) => {
    const user_email = req.body.user_email; // รับค่า user_name จากข้อมูลที่ส่งมาจากหน้า HTML
    const doc_name = req.body.doc_name; // รับค่า doc_name จากข้อมูลที่ส่งมาจากหน้า HTML
    const appoint_time = req.body.appoint_time; // รับค่า appoint_time จากข้อมูลที่ส่งมาจากหน้า HTML
  
    try {
      dbCon.query(
        "INSERT INTO appointment_table(user_email, doc_name, appoint_time) VALUES(?,?,?)",
        [user_email, doc_name, appoint_time],
        (err, results, fields) => {
          if (err) {
            console.log("Error : ", err);
            // ในกรณีที่มีข้อผิดพลาดในการเชื่อมต่อฐานข้อมูลหรือการส่งคำสั่ง SQL
            // คุณควรส่งคำตอบกลับที่ระบุสถานะข้อผิดพลาด
            return res.status(500).json({ message: "Internal Server Error" });
          }
          // การเสร็จสิ้นโดยไม่มีข้อผิดพลาด
          res.redirect('/admin/dashboard');
        }
      );
    } catch (err) {
      console.log(err);
      // ในกรณีที่เกิดข้อผิดพลาดระหว่างการทำงาน
      // คุณควรส่งคำตอบกลับที่ระบุสถานะข้อผิดพลาดเช่นกัน
      return res.status(500).json({ message: "Internal Server Error" });
    }
  });
  

module.exports = router;