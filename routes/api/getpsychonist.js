var express = require("express");
var router = express.Router();
let dbCon = require("../../lib/db");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');



router.get("/get", (req, res) => {
  dbCon.query("SELECT * FROM app_user_roles INNER JOIN app_users ON app_user_roles.UserID = app_users.UserID WHERE app_user_roles.UserGroupID = 2", (error, results, fields) => {
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


router.get("/calendar/test/:psychologist_id", (req, res) => {
  const psychologist_id = req.params.psychologist_id;
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  const lastDayOfCurrentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  console.log(currentDate);
  console.log(lastDayOfCurrentMonth);
  console.log(currentYear);
  console.log(currentMonth);

  const sql = "SELECT id, psychologist_id, DATE_FORMAT(slot_date, '%Y-%m-%d') as slot_date, slot_time, status FROM psychologist_appointment WHERE psychologist_id = ? AND  slot_date BETWEEN ? AND ?";
  dbCon.query(sql, [psychologist_id, currentDate, lastDayOfCurrentMonth], (err, result) => {
    if (err) {
      console.error("Error executing SQL query:", err);
      res.status(500).json({ error: 'Internal server error' });
    } else {

      const groupedResults = {};
      result.forEach(result => {
        const date = result.slot_date;
        if (groupedResults[date]) {
          groupedResults[date].slot_time.push(`${result.id} ${result.slot_time} ${result.status}`);
        } else {
          groupedResults[date] = {
            date,
            slot_time: [`${result.id} ${result.slot_time} ${result.status}`],
          };
        }
      });

      const modifiedResults = Object.values(groupedResults);
      return res.json({ error: false, data: modifiedResults, message: "Success" });
      
    }
  });
});



router.get("/calendar/:psychologist_id", (req, res) => {
  const psychologist_id = req.params.psychologist_id;
  const currentDate = new Date();
  const tomorrow = new Date(currentDate);
  tomorrow.setDate(currentDate.getDate() + 1);
  const lastDayOfCurrentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  dbCon.query("SELECT id, psychologist_id, DATE_FORMAT(slot_date, '%Y-%m-%d') as slot_date, slot_time, status FROM psychologist_appointment WHERE psychologist_id = ? AND slot_date BETWEEN ? AND ?",
    [psychologist_id, tomorrow, lastDayOfCurrentMonth],
    (error, results, fields) => {
      if (error) {
        console.error("Error while fetching psychologists from the database:", error);
        return res.status(500).json({ error: "Internal server error" });
      }

      if (results === undefined || results.length === 0) {
        return res.json({ error: false, data: [], message: "ไม่มีข้อมูลในเดือนนี้" });
      }

      const groupedResults = {};
      results.forEach(result => {
        const date = result.slot_date;
        if (groupedResults[date]) {
          groupedResults[date].slot_time.push(`${result.id} ${result.slot_time} ${result.status}`);
        } else {
          groupedResults[date] = {
            date,
            slot_time: [`${result.id} ${result.slot_time} ${result.status}`],
          };
        }
      });

      const modifiedResults = Object.values(groupedResults);

      return res.json({ error: false, data: modifiedResults, message: "Success" });
    }
  );
});

router.get("/calendar/:psychologist_id/demo", (req, res) => {
  const psychologist_id = req.params.psychologist_id;
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  const lastDayOfCurrentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  console.log(currentDate);
  console.log(lastDayOfCurrentMonth);
  console.log(currentYear);
  console.log(currentMonth);

  const sql = "SELECT id, psychologist_id, DATE_FORMAT(slot_date, '%Y-%m-%d') as slot_date, slot_time, status FROM psychologist_appointment WHERE psychologist_id = ? AND  slot_date BETWEEN ? AND ?";
  dbCon.query(sql, [psychologist_id, currentDate, lastDayOfCurrentMonth], (err, result) => {
    if (err) {
      console.error(
        "Error while fetching psychologists from the database:",
        err
      );
      return res.status(500).json({ error: "Internal server error" });
    }

    if (result === undefined || result.length === 0) {
      return res.json({ error: false, data: [], message: "Empty" });
    }

    return res.json({ error: false, data: result, message: "Success" });
  });
});


router.post("/writeinsurtion", (req, res) => {
  const UserID = req.body.UserID;
  const PsychologistAppoinmentID = req.body.PsychologistAppoinmentID;
  const FileName = req.body.FileName;
  const Description = req.body.Description;
  const Sender = req.body.Sender;


  const updateUserQuery = `UPDATE app_users SET Status = 'None' WHERE UserID = ?`;

  dbCon.beginTransaction(function(err) {
    if (err) {
      console.error(err);
      res.status(500).json({ message: 'Error updating user and appointment status' });
      return;
    }

    dbCon.query(updateUserQuery, [UserID], (userUpdateError, userUpdateResults) => {
      if (userUpdateError) {
        dbCon.rollback(function() {
          console.error(userUpdateError);
          res.status(500).json({ message: 'Error updating user status' });
        });
      } else {
        const updateAppointmentQuery = `UPDATE appointment_table SET text_status = 'Done' WHERE psychologist_appointment_id = ?`;
        dbCon.query(updateAppointmentQuery, [PsychologistAppoinmentID], (appointmentUpdateError, appointmentUpdateResults) => {
          if (appointmentUpdateError) {
            dbCon.rollback(function() {
              console.error(appointmentUpdateError);
              res.status(500).json({ message: 'Error updating appointment status' });
            });
          } else {
            // Insert data into the user_attachments table
            const insertAttachmentQuery = `INSERT INTO user_attachments (UserID, FileName, FileType, Sender, Description) VALUES (?, ?, ?, ?, ?)`;
            const FileType = 2; // Assuming you want to set FileType to 2

            dbCon.query(insertAttachmentQuery, [UserID, FileName, FileType, Sender, Description], (attachmentInsertError, attachmentInsertResults) => {
              if (attachmentInsertError) {
                dbCon.rollback(function() {
                  console.error(attachmentInsertError);
                  res.status(500).json({ message: 'Error inserting attachment data' });
                });
              } else {
                dbCon.commit(function(commitError) {
                  if (commitError) {
                    dbCon.rollback(function() {
                      console.error(commitError);
                      res.status(500).json({ message: 'Error updating user and appointment status' });
                    });
                  } else {
                    res.status(200).json({ message: 'User and appointment status updated, attachment inserted successfully' });
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
