var express = require("express");
var router = express.Router();
let dbCon = require("../lib/db");
const bcrypt = require('bcrypt');


router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/registionaddmin', async (req, res) => {
  const { user_name, user_password, first_name, last_name, user_email } = req.body;
  if (!user_password) {
    return res.status(400).json({ message: "Password is required" });
  }
  const role_id_fk = '3'
  try {

    const hashedPassword = await bcrypt.hash(user_password, 10);

    dbCon.query(
      "INSERT INTO user_table(user_password, user_email,user_name,first_name,last_name,role_id_fk) VALUES(?,?,?,?,?,?)",
      [hashedPassword, user_email, user_name, first_name, last_name, role_id_fk],
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
  dbCon.query("SELECT * FROM user_table WHERE role_id_fk = 2 ORDER BY id desc", (err, rows) => {
    if (err) {
      req.flash("error", err);
      res.render("psychonist", { data: "" });
    } else {
      res.render("psychonist", { data: rows });
    }
  });
});

router.post('/login', (req, res) => {
  const { user_email, user_password } = req.body;

  if (!user_email || !user_password) {
    return res.status(400).json({ message: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' });
  }

  // ค้นหาข้อมูล admin จากฐานข้อมูล
  const query = 'SELECT * FROM user_table WHERE user_email = ?';

  dbCon.query(query, [user_email], (err, results) => {
    if (err) {
      console.error('เกิดข้อผิดพลาดในการค้นหาข้อมูล admin: ' + err.message);
      return res.status(500).json({ message: 'มีข้อผิดพลาดในการล็อกอิน' });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
    }

    const adminData = results[0];

    // ตรวจสอบรหัสผ่าน
    bcrypt.compare(user_password, adminData.user_password, (bcryptErr, bcryptResult) => {
      if (bcryptErr) {
        console.error('เกิดข้อผิดพลาดในการเปรียบเทียบรหัสผ่าน: ' + bcryptErr.message);
        return res.status(500).json({ message: 'มีข้อผิดพลาดในการล็อกอิน' });
      }

      if (!bcryptResult) {
        return res.status(401).json({ message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
      }

      if (adminData.role_id_fk !== 3) {
        return res.status(403).json({ message: 'คุณไม่มีสิทธิ์ในการเข้าถึง dashboard' });
      }

      // ล็อกอินสำเร็จ
      req.session.user_email = user_email;
      res.redirect('/admin/dashboard');
    });
  });
});

router.get("/add", (req, res, next) => {
  const message = req.flash("error");
  res.render("psychonist/add", {
    user_name: "",
    user_email: "",
    first_name: "",
    last_name: "",
    user_password: "",
    phoneTEL: "",
    address: "",
    message: message,
  });
});


router.post("/add", async (req, res, next) => {
  const { user_name, first_name, last_name, user_email, user_password, phoneTEL, address } = req.body;
  let role_id_fk = '2';

  try {
    // เข้ารหัสรหัสผ่านก่อนที่จะเพิ่มลงในฐานข้อมูล
    const hashedPassword = await bcrypt.hash(user_password, 10); // 10 เป็นค่าความคาดหวังในการเข้ารหัส (salt rounds)

    const userTableSQL = 'INSERT INTO user_table (user_name, first_name, last_name, user_email, user_password, role_id_fk) VALUES (?, ?, ?, ?, ?, ?)';
    const psychologistDetailsSQL = 'INSERT INTO psychologist_details (psychologist_id, TEL, address) VALUES (?, ?, ?)';

    dbCon.beginTransaction((err) => {
      if (err) {
        console.error('เกิดข้อผิดพลาดในการเริ่ม transaction:', err);
        return res.status(500).send('มีข้อผิดพลาดในการเพิ่มข้อมูล');
      }

      dbCon.query(userTableSQL, [user_name, first_name, last_name, user_email, hashedPassword, role_id_fk], (error, userResults) => {
        if (error) {
          dbCon.rollback(() => {
            console.error('เกิดข้อผิดพลาดในการเพิ่มข้อมูลในตาราง user_table:', error);
            res.render("psychonist/add", {
              user_name,
              user_email,
              first_name,
              last_name,
              user_password,
              phoneTEL,
              address,
              message: 'ไม่สามารถเพิ่มข้อมูลได้'
            });
          });
        } else {
          const userId = userResults.insertId;

          dbCon.query(psychologistDetailsSQL, [userId, phoneTEL, address], (err, psychologistResults) => {
            if (err) {
              dbCon.rollback(() => {
                console.error('เกิดข้อผิดพลาดในการเพิ่มข้อมูลในตาราง psychologist_details:', err);
                res.render("psychonist/add", {
                  user_name,
                  user_email,
                  first_name,
                  last_name,
                  user_password,
                  phoneTEL,
                  address,
                  message: 'ไม่สามารถเพิ่มข้อมูลได้'
                });
              });
            } else {
              dbCon.commit((commitErr) => {
                if (commitErr) {
                  dbCon.rollback(() => {
                    console.error('เกิดข้อผิดพลาดในการ commit transaction:', commitErr);
                    res.render("psychonist/add", {
                      user_name,
                      user_email,
                      first_name,
                      last_name,
                      user_password,
                      phoneTEL,
                      address,
                      message: 'ไม่สามารถเพิ่มข้อมูลได้'
                    });
                  });
                } else {
                  res.redirect('/admin/dashboard');
                }
              });
            }
          });
        }
      });
    });
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการเข้ารหัสรหัสผ่าน:', error);
    res.status(500).send('มีข้อผิดพลาดในการเพิ่มข้อมูล');
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
  const psychonist_appointments_id = req.body.psychonist_appointments_id; // รับค่า psychonist_appointments_id จากข้อมูลที่ส่งมาจากหน้า HTML
  const user_id = req.body.user_id; // รับค่า user_id จากข้อมูลที่ส่งมาจากหน้า HTML
  const status = req.body.status;

  try {
    dbCon.query(
      "UPDATE psychologist_appointments SET status = -1, user_id = ? WHERE id = ?",
      [user_id, psychonist_appointments_id],
      (err, results, fields) => {
        if (err) {
          console.log("Error : ", err);
          // ในกรณีที่มีข้อผิดพลาดในการเชื่อมต่อฐานข้อมูลหรือการส่งคำสั่ง SQL
          // คุณควรส่งคำตอบกลับที่ระบุสถานะข้อผิดพลาด
          return res.status(500).json({ message: "Internal Server Error" });
        }

        // เพิ่มข้อมูลลงในตาราง "appointment_table"
        dbCon.query(
          "INSERT INTO appointment_table (psychonist_appointments_id, status) VALUES (?, ?)",
          [psychonist_appointments_id, status],
          (insertErr, insertResults, insertFields) => {
            if (insertErr) {
              console.log("Error inserting data into appointment_table: ", insertErr);
              // ในกรณีที่มีข้อผิดพลาดในการเชื่อมต่อฐานข้อมูลหรือการส่งคำสั่ง SQL
              // คุณควรส่งคำตอบกลับที่ระบุสถานะข้อผิดพลาด
              return res.status(500).json({ message: "Internal Server Error" });
            }

            // การเสร็จสิ้นโดยไม่มีข้อผิดพลาด
            res.redirect('/admin/dashboard');
          }
        );
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