var express = require("express");
var router = express.Router();
let dbCon = require("../../lib/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");

router.get("/", (req, res, next) => {
    dbCon.query(
        "SELECT * FROM user_refunds",
        (err, rows) => {
          if (err) {
            req.flash("error", err);
            res.render("psychonist/refund", { data: "" });
          } else {
            res.render("psychonist/refund", { data: rows });
          }
        }
      );
});

router.get("/get", (req, res, next) => {
  dbCon.query(
      "SELECT * FROM user_refunds",
      (err, rows) => {
        if (err) {
          req.flash("error", err);
          res.render("psychonist/refund", { data: "" });
        } else {
          res.render("psychonist/refund", { data: rows });
        }
      }
    );

  // sql = `SELECT * FROM user_refunds`
  // dbCon.query(sql, (error, results, fields) => {
  //   if (error) {
  //     console.error(
  //       "Error while fetching psychologists from the database:",
  //       error
  //     );
  //     return res.status(500).json({ error: "Internal server error" });
  //   }

  //   if (results === undefined || results.length === 0) {
  //     return res.json({ error: false, data: [], message: "Empty" });
  //   }

  //   return res.json({ error: false, data: results, message: "Success" });
  // });
});


router.post("/request", (req, res, next) => {
  const PaymentID = req.body.PaymentID;
  const UserID = req.body.UserID;
  const Promtpay = req.body.Promtpay;
  const PsychologistAppoinmentID = req.body.PsychologistAppoinmentID;

  // สร้างคำสั่ง SQL สำหรับอัปเดตค่าในตาราง psychologist_appointment
  const updateQuery = `
    UPDATE psychologist_appointment
    SET status = 0, user_id = NULL, PaymentID = NULL
    WHERE PaymentID = ?`;

  // สร้างคำสั่ง SQL สำหรับเพิ่มค่าในตาราง user_refunds
  const insertQuery = `
    INSERT INTO user_refunds(PaymentID, Promtpay)
    VALUES(?, ?)`;
    
  // สร้างคำสั่ง SQL สำหรับอัปเดตค่าในตาราง app_users
  const updateUserStatusQuery = `
    UPDATE app_users
    SET Status = 'None'
    WHERE UserID = ?`;

  const deleteQuery = `
    DELETE FROM appointment_table
    WHERE psychologist_appointment_id = ?`;

  // เริ่ม transaction
  dbCon.beginTransaction((transactionErr) => {
    if (transactionErr) {
      console.error("Error starting transaction: " + transactionErr);
      res.status(500).send("Error starting transaction");
      return;
    }

    // อัปเดตค่าในตาราง psychologist_appointment
    dbCon.query(updateQuery, [PaymentID], (updateErr, updateResults) => {
      if (updateErr) {
        console.error("Error updating psychologist_appointment: " + updateErr);
        dbCon.rollback(() => {
          res.status(500).send("Error updating psychologist_appointment");
        });
      } else {
        // ลบข้อมูลในตาราง appointment_table
        dbCon.query(deleteQuery, [PsychologistAppoinmentID], (deleteErr, deleteResults) => {
          if (deleteErr) {
            console.error("Error deleting from appointment_table: " + deleteErr);
            dbCon.rollback(() => {
              res.status(500).send("Error deleting from appointment_table");
            });
          } else {
            // เพิ่มค่าในตาราง user_refunds
            dbCon.query(insertQuery, [PaymentID, Promtpay], (insertErr, insertResults) => {
              if (insertErr) {
                console.error("Error inserting into user_refunds: " + insertErr);
                dbCon.rollback(() => {
                  res.status(500).send("Error inserting into user_refunds");
                });
              } else {
                // อัปเดตค่าในตาราง app_users
                dbCon.query(updateUserStatusQuery, [UserID], (updateUserErr, updateUserResults) => {
                  if (updateUserErr) {
                    console.error("Error updating app_users: " + updateUserErr);
                    dbCon.rollback(() => {
                      res.status(500).send("Error updating app_users");
                    });
                  } else {
                    // ทำการ commit และสิ้นสุด transaction
                    dbCon.commit((commitErr) => {
                      if (commitErr) {
                        console.error("Error committing transaction: " + commitErr);
                        dbCon.rollback(() => {
                          res.status(500).send("Error committing transaction");
                        });
                      } else {
                        // ทุกอย่างสำเร็จ
                        res.json({ message: "Refund request processed successfully." });
                      }
                    });
                  }
                });
              }
            });
          }
        });
      }
    });
  });
});







module.exports = router;