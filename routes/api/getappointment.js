var express = require("express");
var router = express.Router();
let dbCon = require("../../lib/db");

router.get("/get", (req, res) => {
  dbCon.query(
    `
    SELECT appointment_table.*, psychologist_appointment.*, user_table.*
    FROM appointment_table
    INNER JOIN psychologist_appointment
    ON appointment_table.psychologist_appointment_id = psychologist_appointment.id
    INNER JOIN user_table
    ON psychologist_appointment.psychologist_id = user_table.id
  `,
    (error, results, fields) => {
      if (error) {
        console.error("Error while fetching from the database:", error);
        return res.status(500).json({ error: "Internal server error" });
      }

      if (results === undefined || results.length === 0) {
        return res.json({ error: false, data: [], message: "Empty" });
      }

      return res.json({ error: false, data: results, message: "Success" });
    }
  );
});

router.get("/get/:user_id", (req, res) => {
  const userId = req.params.user_id;
  dbCon.query(
    `
    SELECT appointment_table.*, psychologist_appointment.*, user_table.*
    FROM appointment_table
    INNER JOIN psychologist_appointment
    ON appointment_table.psychologist_appointment_id = psychologist_appointment.id
    INNER JOIN user_table
    ON psychologist_appointment.psychologist_id = user_table.id
    WHERE psychologist_appointment.user_id = ?
    `,
    [userId],
    (error, results, fields) => {
      if (error) {
        console.error("Error while fetching from the database:", error);
        return res.status(500).json({ error: "Internal server error" });
      }

      if (results === undefined || results.length === 0) {
        return res.json({ error: false, data: [], message: "Empty" });
      }
      results = results.map((row) => ({
        ...row,
        slot_date: row.slot_date.toISOString().split("T")[0],
        slot_time: row.slot_time.substring(0, 5),
      }));
      return res.json({ error: false, data: results, message: "Success" });
    }
  );
});




router.get("/psychologist/:user_id", (req, res) => {
  const userId = req.params.user_id;
  dbCon.query(
    `
    SELECT * FROM psychologist_appointment WHERE psychologist_id = ? AND status = 1
    `,
    [userId],
    (error, results, fields) => {
      if (error) {
        console.error("Error while fetching from the database:", error);
        return res.status(500).json({ error: "Internal server error" });
      }

      if (results === undefined || results.length === 0) {
        return res.json({ error: false, data: [], message: "Empty" });
      }
      results = results.map((row) => ({
        ...row,
        slot_date: row.slot_date.toISOString().split("T")[0],
        slot_time: row.slot_time.substring(0, 5),
      }));
      return res.json({ error: false, data: results, message: "Success" });
    }
  );
});

router.get("/:doc_name", (req, res) => {
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

      return res.json({ error: false, data: results, message: "Success" });
    }
  );
});

router.get("/appoint/:psycholonist_id", (req, res) => {
  const psychologist_id = req.params.psycholonist_id;
  dbCon.query(
    "SELECT * FROM psychologist_appointments WHERE psycholonist_id = ?",
    [psychologist_id],
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

      return res.json({ error: false, data: results, message: "Success" });
    }
  );
});

module.exports = router;
