var express = require("express");
var router = express.Router();
let dbCon = require("../../lib/db");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');



router.get("/get", (req, res) => {
  dbCon.query("SELECT * FROM psychologist_table", (error, results, fields) => {
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


router.get("/getappointments/:doc_name", (req, res) => {
  const doc_name = req.params.doc_name;
  dbCon.query(
    "SELECT * FROM appointment_table WHERE doc_name = ?",
    [doc_name],
    (error, results, fields) => {
      if (error) {
        console.error("Error while fetching from the database:", error);
        return res.status(500).json({ error: "Internal server error" });
      }

      if (results === undefined || results.length === 0) {
        return res.json({
          error: false,
          data: [],
          message: "No appointments for this user",
        });
      }

      dbCon.query(
        "SELECT * FROM doc_user_table WHERE doc_username = ?",
        [doc_name],
        (error, docResults, fields) => {
          if (error) {
            console.error("Error while fetching from the database:", error);
            return res.status(500).json({ error: "Internal server error" });
          }

          if (docResults === undefined || docResults.length === 0) {
            return res.json({
              error: false,
              data: [],
              message: "Doctor not found",
            });
          }

          const doctorInfo = docResults[0];
          const appointmentsWithInfo = results.map((appointment) => {
            return {
              appoint_id: appointment.appoint_id,
              doc_name: appointment.doc_name,
              appoint_time: appointment.appoint_time,
              user_email: appointment.user_email,
              status: appointment.status,
              date_appoint: appointment.date_appoint,
              doc_email: doctorInfo.doc_email,
            };
          });
          return res.json({
            error: false,
            data: appointmentsWithInfo,
            message: "Success",
          });
        }
      );
    }
  );
});


router.get("/calendar/:psychologist_id", (req, res) => {
  const psychologist_id = req.params.psychologist_id;
  dbCon.query("SELECT * FROM psychologist_appointments WHERE psycholonist_id = ?",[psychologist_id], (error, results, fields) => {
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


router.post('/login', (req, res) => {
  const { psychologist_email, psychologist_password } = req.body;

  if (!psychologist_email || !psychologist_password) {
    return res.status(400).json({ message: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' });
  }
  
  const query = 'SELECT id, psychologist_email, psychologist_password ,psychologist_username FROM psychologist_table WHERE psychologist_email = ?';


  dbCon.query(query, [psychologist_email], async (err, results) => {
    if (err) {
      console.error('เกิดข้อผิดพลาดในการค้นหาข้อมูล admin: ' + err.message);
      return res.status(500).json({ message: 'มีข้อผิดพลาดในการล็อกอิน' });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
    }

    const userData = results[0];

    
    const payload = {
      email: userData.psychologist_email,
      id: userData.id,
      name: userData.psychologist_username,
      // status: userData.status, // เพิ่ม user_id ใน payload
    };


    try {
      const isPasswordCorrect = await bcrypt.compare(psychologist_password, userData.psychologist_password);
      if (!isPasswordCorrect) {
        return res.status(401).json({ message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
      }

      const token = jwt.sign(payload, 'shhhhh', { expiresIn: '1h' });
      res.status(200).json({ status: true, success: "sendData", token: token });
    } catch (bcryptErr) {
      console.error('เกิดข้อผิดพลาดในการเปรียบเทียบรหัสผ่าน: ' + bcryptErr.message);
      return res.status(500).json({ message: 'มีข้อผิดพลาดในการล็อกอิน' });
    }
  });
});



module.exports = router;
