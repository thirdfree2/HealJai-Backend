var express = require("express");
var router = express.Router();
let dbCon = require("../../lib/db");

router.get('/get', (req, res) => {
  dbCon.query('SELECT * FROM doc_user_table', (error, results, fields) => {
    if (error) {
      console.error('Error while fetching psychologists from the database:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (results === undefined || results.length === 0) {
      return res.json({ error: false, data: [], message: 'Empty' });
    }

    return res.json({ error: false, data: results, message: 'Success' });
  });
});

module.exports = router;