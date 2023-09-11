var express = require("express");
var router = express.Router();
let dbCon = require("../lib/db");
const bcrypt = require('bcrypt');

router.get("/", (req, res, next) => {
  dbCon.query("SELECT * FROM doc_user_table ORDER BY id desc", (err, rows) => {
    if (err) {
      req.flash("error", err);
      res.render("psychonist", { data: "" });
    } else {
      res.render("psychonist", { data: rows });
    }
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
            res.redirect('/psychonist');
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

  res.render('psychonist/appointment',{
    title: 'Appointment',
  });
});


// Assuming you have already imported and set up your Express.js app and MySQL connection

// Define a route handler for the "payment" page
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
  const id = req.params.id; // ดึงค่า id จากพารามิเตอร์ URL
  const user_name = req.query.user_name;
  const doc_name = req.query.doc_name;
  const appoint_time = req.query.appoint_time;

  // ทำสิ่งที่คุณต้องการกับข้อมูลที่ได้รับ
  res.render('psychonist/paymentsdetails', {
    id,
    user_name,
    doc_name,
    appoint_time,
  });
});








module.exports = router;

