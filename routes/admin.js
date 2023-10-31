var express = require("express");
var router = express.Router();
let dbCon = require("../lib/db");
const bcrypt = require("bcrypt");
const path = require('path');
const multer = require("multer");



router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
});

// "UserName": "Dummy2",
// "Password": "1234",
// "FirstName": "Toy",
// "LastName": "Simton",
// "Tel": "123-587-8774",
// "BirthDay": "18-02-2000",
// "Address": "Grand-Line",
// "Email": "admin2@gmail.com"

router.post("/registionadmin", async (req, res) => {
  const {
    UserName,
    Password,
    FirstName,
    LastName,
    Tel,
    BirthDay,
    Address,
    Email,
  } = req.body;
  if (!Password) {
    return res.status(400).json({ message: "Password is required" });
  }
  try {
    const hashedPassword = await bcrypt.hash(Password, 10);

    dbCon.query(
      "INSERT INTO app_users(UserName, Password, FirstName, LastName, Tel, BirthDay, Address, Email) VALUES(?,?,?,?,?,?,?,?)",
      [
        UserName,
        hashedPassword,
        FirstName,
        LastName,
        Tel,
        BirthDay,
        Address,
        Email,
      ],
      (err, results, fields) => {
        if (err) {
          console.log("Error : ", err);
          return res.status(400).send();
        }

        // Insert into app_user_roles with UserGroupID = 1
        const userId = results.insertId; // Assuming the auto-generated UserID
        dbCon.query(
          "INSERT INTO app_user_roles(UserID, UserGroupID) VALUES(?, 1)",
          [userId],
          (err, results, fields) => {
            if (err) {
              console.log("Error : ", err);
              return res.status(400).send();
            }

            return res.status(201).json({ message: "Success" });
          }
        );
      }
    );
  } catch (err) {
    console.log(err);
    return res.status(500).send();
  }
});

router.get("/dashboard", (req, res, next) => {
  dbCon.query(
    "SELECT au.*, aur.* FROM app_user_roles aur JOIN app_users au ON aur.UserID = au.UserID WHERE aur.UserGroupID = 2 ORDER BY aur.UserID DESC",
    (err, rows) => {
      if (err) {
        req.flash("error", err);
        res.render("psychonist", { data: "" });
      } else {
        res.render("psychonist", { data: rows });
      }
    }
  );
});

router.post("/login", (req, res) => {
  const { Email, Password } = req.body;

  if (!Email || !Password) {
    return res.status(400).json({ message: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน" });
  }

  const query = "SELECT * FROM app_users WHERE Email = ?";

  dbCon.query(query, [Email], (err, results) => {
    if (err) {
      console.error("เกิดข้อผิดพลาดในการค้นหาข้อมูล admin: " + err.message);
      return res.status(500).json({ message: "มีข้อผิดพลาดในการล็อกอิน" });
    }

    if (results.length === 0) {
      return res
        .status(401)
        .json({ message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
    }

    const adminData = results[0];
    bcrypt.compare(Password, adminData.Password, (bcryptErr, bcryptResult) => {
      if (bcryptErr) {
        console.error(
          "เกิดข้อผิดพลาดในการเปรียบเทียบรหัสผ่าน: " + bcryptErr.message
        );
        return res.status(500).json({ message: "มีข้อผิดพลาดในการล็อกอิน" });
      }

      if (!bcryptResult) {
        return res
          .status(401)
          .json({ message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
      }

      const userID = adminData.UserID;

      dbCon.query(
        "SELECT UserGroupID FROM app_user_roles WHERE UserID = ?",
        [userID],
        (err, roleResults) => {
          if (err) {
            console.error(
              "เกิดข้อผิดพลาดในการค้นหา UserGroupID: " + err.message
            );
            return res
              .status(500)
              .json({ message: "มีข้อผิดพลาดในการล็อกอิน" });
          }

          if (roleResults.length === 0) {
            console.error("ไม่พบ UserGroupID สำหรับ UserID: " + userID);
            return res
              .status(500)
              .json({ message: "มีข้อผิดพลาดในการล็อกอิน" });
          }

          const userGroupID = roleResults[0].UserGroupID;
          console.log("UserGroupID:", userGroupID);

          if (userGroupID !== 1) {
            return res
              .status(401)
              .json({ message: "ไม่ได้รับอนุญาตให้ล็อกอิน" });
          }
          res.redirect("/admin/dashboard");
        }
      );
    });
  });
});

router.get("/add", (req, res, next) => {
  res.render("psychonist/add", { });
});

router.post("/add", async (req, res, next) => {
  const { UserID, UserName, FirstName, LastName, Email, Password, Tel, Address } = req.body;
  try {
    // เข้ารหัสรหัสผ่านก่อนที่จะเพิ่มลงในฐานข้อมูล
    const hashedPassword = await bcrypt.hash(Password, 10); // 10 เป็นค่าความคาดหวังในการเข้ารหัส (salt rounds)

    const userTableSQL =
      "INSERT INTO app_users (UserID, UserName, FirstName, LastName, Email, Password, TEL, Address) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

    const psychologistDetailsSQL =
      "INSERT INTO app_user_roles (UserID, UserGroupID) VALUES (?, 2)";

    dbCon.beginTransaction((err) => {
      if (err) {
        console.error("เกิดข้อผิดพลาดในการเริ่ม transaction:", err);
        return res.status(500).send("มีข้อผิดพลาดในการเพิ่มข้อมูล");
      }

      dbCon.query(
        userTableSQL,
        [UserID, UserName, FirstName, LastName, Email, hashedPassword, Tel, Address],
        (error, userResults) => {
          if (error) {
            dbCon.rollback(() => {
              console.error(
                "เกิดข้อผิดพลาดในการเพิ่มข้อมูลในตาราง user_table:",
                error
              );
              res.render("psychonist/add", {
                UserID,
                Email,
                FirstName,
                LastName,
                Password,
                Tel,
                Address,
                message: "ไม่สามารถเพิ่มข้อมูลได้",
              });
            });
          } else {
            const userId = userResults.insertId;

            dbCon.query(
              psychologistDetailsSQL,
              [userId],
              (err, psychologistResults) => {
                if (err) {
                  dbCon.rollback(() => {
                    console.error(
                      "เกิดข้อผิดพลาดในการเพิ่มข้อมูลในตาราง psychologist_details:",
                      err
                    );
                    res.render("psychonist/add", {
                      UserID,
                      Email,
                      FirstName,
                      LastName,
                      Password,
                      Tel,
                      Address,
                      message: "ไม่สามารถเพิ่มข้อมูลได้",
                    });
                  });
                } else {
                  // เพิ่มรายการนัดหมอจิตเพื่อทุกวันในช่วง 365 วัน
                  const startDate = new Date();
                  for (let i = 0; i < 365; i++) {
                    startDate.setDate(startDate.getDate() + 1);
                    const formattedDate = startDate.toISOString().slice(0, 10);
                    const slotDate = formattedDate;
                    const timeSlots = ['08:00:00', '12:00:00', '15:00:00', '17:00:00'];

                    timeSlots.forEach((time) => {
                      const insertSQL = `INSERT INTO psychologist_appointment (psychologist_id, slot_date, slot_time, status) VALUES (?, ?, ?, '0')`;
                      dbCon.query(
                        insertSQL,
                        [userId, slotDate, time],
                        (err, results) => {
                          if (err) {
                            console.error("เกิดข้อผิดพลาดในการเพิ่มข้อมูล:", err);
                          }
                        }
                      );
                    });
                  }

                  dbCon.commit((commitErr) => {
                    if (commitErr) {
                      dbCon.rollback(() => {
                        console.error(
                          "เกิดข้อผิดพลาดในการ commit transaction:",
                          commitErr
                        );
                        res.render("psychonist/add", {
                          UserID,
                          Email,
                          FirstName,
                          LastName,
                          Password,
                          Tel,
                          Address,
                          message: "ไม่สามารถเพิ่มข้อมูลได้",
                        });
                      });
                    } else {
                      res.redirect("/admin/dashboard");
                    }
                  });
                }
              }
            );
          }
        }
      );
    });
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการเข้ารหัสรหัสผ่าน:", error);
    res.status(500).send("มีข้อผิดพลาดในการเพิ่มข้อมูล");
  }
});

router.get("/appointment", (req, res) => {
  dbCon.query(
    "SELECT * FROM appointment_table ORDER BY id desc",
    (err, rows) => {
      if (err) {
        req.flash("error", err);
        res.render("psychonist/appointment", {
          title: "Appointment",
          data: [],
        });
      } else {
        // Render the "psychonist/payment" template with the retrieved data
        res.render("psychonist/appointment", {
          title: "Appointment",
          data: rows,
        });
      }
    }
  );
});

router.get("/payment/get", (req, res) => {
  sql = `SELECT payment_table.*, app_users.UserName AS patient_username, psychologist_appointment.psychologist_id, app_users_psychologist.UserName AS psychologist_username
  FROM payment_table
  INNER JOIN app_users ON payment_table.patient_id = app_users.UserID
  INNER JOIN psychologist_appointment ON payment_table.psychologist_appointments_id = psychologist_appointment.id
  INNER JOIN app_users AS app_users_psychologist ON psychologist_appointment.psychologist_id = app_users_psychologist.UserID
  ORDER BY payment_table.id DESC;   
  `
  dbCon.query(sql, (error, results, fields) => {
    if (error) {
      console.error(
        "Error while fetching psychologists from the database:",
        error
      );
      return res.status(500).json({ error: "Internal server error" });
    }

    if (results === undefined || results.length === 0) {
      return res.json({ error: false, data: [], message: "Empty" });
    }

    return res.json({ error: false, data: results, message: "Success" });
  });
});


router.get("/payment", (req, res) => {
  sql = `SELECT payment_table.*, app_users.UserName AS patient_username, psychologist_appointment.psychologist_id, app_users_psychologist.UserName AS psychologist_username
  FROM payment_table
  INNER JOIN app_users ON payment_table.patient_id = app_users.UserID
  INNER JOIN psychologist_appointment ON payment_table.psychologist_appointments_id = psychologist_appointment.id
  INNER JOIN app_users AS app_users_psychologist ON psychologist_appointment.psychologist_id = app_users_psychologist.UserID
  ORDER BY payment_table.id DESC;`;
  dbCon.query(sql, (err, rows) => {
    if (err) {
      req.flash("error", err);
      res.render("psychonist/payment", { title: "Payment", data: [] });
    } else {
      // var target_path = path.resolve( __dirname, "../client/src/images/${ req.files.uploads[0].name }" );
      // Render the "psychonist/payment" template with the retrieved data
      res.render("psychonist/payment", { title: "Payment", data: rows });
    }
  });
});


router.get("/paymentsdetails", (req, res) => {
  const id = req.params.id;
  const UserID = req.query.user_name;
  const doc_name = req.query.doc_name;
  const appoint_time = req.query.appoint_time;

  res.render("psychonist/paymentsdetails", {
    id,
    user_name,
    doc_name,
    appoint_time,
  });
});

router.post("/approve-payment", async (req, res) => {
  const paymentID = req.body.paymentID;
  const psychonist_appointments_id = req.body.psychologist_appointments_id; // รับค่า psychonist_appointments_id จากข้อมูลที่ส่งมาจากหน้า HTML
  const user_id = req.body.patient_id; // รับค่า user_id จากข้อมูลที่ส่งมาจากหน้า HTML
  const status = req.body.status;

  try {
    dbCon.query(
      "UPDATE psychologist_appointment SET status = 1, user_id = ?, PaymentID = ? WHERE id = ?",
      [user_id, paymentID, psychonist_appointments_id],
      (err, results, fields) => {
    
        if (err) {
          console.log("Error : ", err);
          // ในกรณีที่มีข้อผิดพลาดในการเชื่อมต่อฐานข้อมูลหรือการส่งคำสั่ง SQL
          // คุณควรส่งคำตอบกลับที่ระบุสถานะข้อผิดพลาด
          return res.status(500).json({ message: "Internal Server Error" });
        }

        // เพิ่มข้อมูลลงในตาราง "appointment_table"
        dbCon.query(
          "INSERT INTO appointment_table (psychologist_appointment_id , text_status) VALUES (?, ?)",
          [psychonist_appointments_id, status],
          (insertErr, insertResults, insertFields) => {
            if (insertErr) {
              console.log(
                "Error inserting data into appointment_table: ",
                insertErr
              );
              // ในกรณีที่มีข้อผิดพลาดในการเชื่อมต่อฐานข้อมูลหรือการส่งคำสั่ง SQL
              // คุณควรส่งคำตอบกลับที่ระบุสถานะข้อผิดพลาด
              return res.status(500).json({ message: "Internal Server Error" });
            }

            // การเสร็จสิ้นโดยไม่มีข้อผิดพลาด
            res.redirect("/admin/dashboard");
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

router.get("/edit/:UserID", (req, res) => {
  const userID = req.params.UserID;
    dbCon.query('SELECT * FROM app_users WHERE UserID = ?', [userID], (error, results) => {
      if (error) {
        console.error('Error querying the database:', error);
        connection.end();
        return res.status(500).send('Database query error');
      }
      if (results.length === 0) {
        return res.status(404).send('Psychologist not found');
      }
      const psychonistData = results[0];
      res.render("psychonist/edit", { title: "PsychologistDetails", psychonistData });
    });
});

router.get("/details/:UserID", (req, res) => {
  const userID = req.params.UserID;
  dbCon.query('SELECT * FROM app_users WHERE UserID = ?', [userID], (error, results) => {
    if (error) {
      console.error('Error querying the database:', error);
      connection.end();
      return res.status(500).send('Database query error');
    }
    if (results.length === 0) {
      return res.status(404).send('Psychologist not found');
    }
    const psychonistData = results[0];

    dbCon.query('SELECT * FROM user_attachments WHERE UserID = ? AND FileType = 1', [userID], (error, attachments) => {
      if (error) {
        console.error('Error querying the database:', error);
        return res.status(500).send('Database query error');
      }

      res.render("psychonist/details", { title: "PsychologistDetails", psychonistData, attachments });
    });
  });
});


router.post("/edit/:UserID", (req, res) => {
  const userID = req.params.UserID;
  const newName = req.body.name;
  const newEmail = req.body.email;
  const newFirstName = req.body['first-name'];
  const newLastName = req.body['last-name'];
  const newAddress = req.body.address;
  const newTel = req.body.tel;

  const updateQuery = 'UPDATE app_users SET UserName = ?, Email = ?, FirstName = ?, LastName = ?, Address = ?, Tel = ? WHERE UserID = ?';

  dbCon.query(updateQuery, [newName, newEmail, newFirstName, newLastName, newAddress, newTel, userID], (error, results) => {
    if (error) {
      console.error('Error updating the database:', error);
      return res.status(500).send('Database update error');
    }
    res.redirect('/admin/dashboard');
  });
});

const storage = multer.diskStorage({
  destination: "public/uploads",
  filename: (req, file, cb) => {
    const uniqueSuffix = `document_img_${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const fileExtension = path.extname(file.originalname);
    const newFilename = `${uniqueSuffix}${fileExtension}`;
    cb(null, newFilename); // คุณไม่ต้องกำหนด req.file.filename ที่นี่
  },
});

const upload = multer({
  storage: storage,
});

router.post("/upload/:UserID", upload.single("document"), async (req,res) => {
  const userID = req.params.UserID;
  if (req.file) {
    const fileName = req.file.filename;
    const fileType = 1;
    const addAttachment = "INSERT INTO user_attachments(UserID, FileName, FileType) VALUES(?, ?, ?)";
    dbCon.query(addAttachment, [userID, fileName, fileType], (err, result) => {
      if (err) {
        console.error('เกิดข้อผิดพลาดในการเพิ่มข้อมูลเอกสารลงในฐานข้อมูล: ' + err.message);
        res.send('ไม่สามารถเพิ่มข้อมูลเอกสารในฐานข้อมูล');
      } else {
        console.log('เพิ่มข้อมูลเอกสารในฐานข้อมูลสำเร็จ');
        res.redirect('/admin/details/'+userID);
      }
    });
  } else {
    res.send('ไม่สามารถอัพโหลดเอกสาร');
  }
});

router.get('/delete/:attachmentId/:UserId', (req, res) => {
  const attachmentId = req.params.attachmentId;
  const userID = req.params.UserId;

  const sql = 'DELETE FROM user_attachments WHERE AttachmentID = ?';
  dbCon.query(sql, [attachmentId], function (err) {
      if (err) {
          return res.send('ไม่สามารถลบข้อมูล');
      }
      return res.redirect('/admin/details/'+userID);
  });
});


module.exports = router;
