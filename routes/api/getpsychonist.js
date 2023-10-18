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


router.get("/calendar/:psychologist_id", (req, res) => {
  const psychologist_id = req.params.psychologist_id;
  dbCon.query("SELECT * FROM psychologist_appointment WHERE psychologist_id  = ?",[psychologist_id], (error, results, fields) => {
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




module.exports = router;
