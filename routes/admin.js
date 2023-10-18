var express = require("express");
var router = express.Router();
let dbCon = require("../lib/db");
const bcrypt = require("bcrypt");

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
  const message = req.flash("error");
  res.render("psychonist/add", {
    UserName: "",
    Email: "",
    FirstName: "",
    LastName: "",
    Password: "",
    Tel: "",
    Address: "",
    message: message,
  });
});

router.post("/add", async (req, res, next) => {
  const { UserID, UserName,FirstName, LastName, Email, Password, Tel, Address } =
    req.body;

  try {
    // เข้ารหัสรหัสผ่านก่อนที่จะเพิ่มลงในฐานข้อมูล
    const hashedPassword = await bcrypt.hash(Password, 10); // 10 เป็นค่าความคาดหวังในการเข้ารหัส (salt rounds)

    const userTableSQL =
      "INSERT INTO app_users (UserID, UserName,FirstName, LastName, Email, Password, TEL, Address) VALUES (?, ?, ?, ?, ?, ?, ?,?)";

    const psychologistDetailsSQL =
      "INSERT INTO app_user_roles (UserID, UserGroupID) VALUES (?,2)";

    dbCon.beginTransaction((err) => {
      if (err) {
        console.error("เกิดข้อผิดพลาดในการเริ่ม transaction:", err);
        return res.status(500).send("มีข้อผิดพลาดในการเพิ่มข้อมูล");
      }

      dbCon.query(
        userTableSQL,
        [UserID, UserName,FirstName, LastName, Email, hashedPassword, Tel, Address],
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

router.get("/payment", (req, res) => {
  dbCon.query("SELECT * FROM payment_table ORDER BY id desc", (err, rows) => {
    if (err) {
      req.flash("error", err);
      res.render("psychonist/payment", { title: "Payment", data: [] });
    } else {
      // Render the "psychonist/payment" template with the retrieved data
      res.render("psychonist/payment", { title: "Payment", data: rows });
    }
  });
});

router.get("/paymentsdetails/", (req, res) => {
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
  const psychonist_appointments_id = req.body.psychologist_appointments_id; // รับค่า psychonist_appointments_id จากข้อมูลที่ส่งมาจากหน้า HTML
  const user_id = req.body.patient_id; // รับค่า user_id จากข้อมูลที่ส่งมาจากหน้า HTML
  const status = req.body.status;

  try {
    dbCon.query(
      "UPDATE psychologist_appointment SET status = 1, user_id = ? WHERE id = ?",
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



module.exports = router;
