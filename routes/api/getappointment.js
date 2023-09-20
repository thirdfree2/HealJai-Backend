var express = require("express");
var router = express.Router();
let dbCon = require("../../lib/db");

router.get('/get', (req, res) => {
  dbCon.query('SELECT * FROM appointment_table', (error, results, fields) => {
    if (error) {
      console.error('Error while fetching from the database:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (results === undefined || results.length === 0) {
      return res.json({ error: false, data: [], message: 'Empty' });
    }

    return res.json({ error: false, data: results, message: 'Success' });
  });
});

router.get('/get/:id', (req, res) => {
  const id = req.params.id;
  dbCon.query('SELECT * FROM appointment_table WHERE id = ?', [id], (error, results, fields) => {
    if (error) {
      console.error('Error while fetching from the database:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (results === undefined || results.length === 0) {
      return res.json({ error: false, data: [], message: 'No appointments for this user' });
    }

    return res.json({ error: false, data: results, message: 'Success' });
  });
});



router.get('/:doc_name',(req,res) => {
  const doc_name = req.params.doc_name;
  dbCon.query('SELECT * FROM appointment_table WHERE doc_name = ?', [doc_name], (error, results, fields) => {
    if (error) {
      console.error('Error while fetching from the database:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (results === undefined || results.length === 0) {
      return res.json({ error: false, data: [], message: 'No appointments for this user' });
    }

    return res.json({ error: false, data: results, message: 'Success' });
  });
})


router.get('/appoint/:psycholonist_id', (req, res) => {
  const psychologist_id = req.params.psycholonist_id;
  dbCon.query('SELECT * FROM psychologist_appointments WHERE psycholonist_id = ?', [psychologist_id], (error, results, fields) => {
    if (error) {
      console.error('Error while fetching from the database:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (results === undefined || results.length === 0) {
      return res.json({ error: false, data: [], message: 'No appointments for this user' });
    }

    return res.json({ error: false, data: results, message: 'Success' });
  });
});



module.exports = router;