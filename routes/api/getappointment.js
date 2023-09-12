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

router.get('/get/:user_name', (req, res) => {
  const user_name = req.params.user_name;

  dbCon.query('SELECT * FROM appointment_table WHERE user_name = ?', [user_name], (error, results, fields) => {
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