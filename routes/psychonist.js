var express = require("express");
var router = express.Router();
let dbCon = require("../lib/db");

router.get("/", (req, res, next) => {
  dbCon.query("SELECT * FROM doc_user_table ORDER BY id desc", (err, rows) => {
    if (err) {
      req.flash("error", err);
      res.render("psychonist", { data: "" });
    } else {
      res.render("psychonist", { data: rows });
    }
  });
});

router.get("/add", (req, res, next) => {
  const message = req.flash("error");
  res.render("psychonist/add", {
    doc_username: "",
    doc_email: "",
    doc_password: "",
    doc_phonenumber: "",
    doc_address: "",
    message: message,
  });
});

router.post("/add", (req, res, next) => {
  let doc_username = req.body.doc_username;
  let doc_email = req.body.doc_email;
  let doc_password = req.body.doc_password;
  let doc_phonenumber = req.body.doc_phonenumber;
  let doc_address = req.body.doc_address;
  let errors = false;

  if (
    !doc_username ||
    !doc_email ||
    !doc_password ||
    !doc_phonenumber ||
    !doc_address
  ) {
    errors = true;
    req.flash("error", "Please fill in all fields.");
    return res.render("psychonist/add", {
      doc_username,
      doc_email,
      doc_password,
      doc_phonenumber,
      doc_address,
    });
  }

  if (!errors) {
    let form_data = {
      doc_username: doc_username,
      doc_email: doc_email,
      doc_password: doc_password,
      doc_phonenumber: doc_phonenumber,
      doc_address: doc_address,
    };
    dbCon.query(
      "INSERT INTO doc_user_table SET ?",
      form_data,
      (err, result) => {
        if (err) {
          req.flash("error", err);
          res.render("psychonist/add", {
            doc_username: form_data.doc_username,
            doc_email: form_data.doc_email,
            doc_password: form_data.doc_password,
            doc_phonenumber: form_data.doc_phonenumber,
            doc_address: form_data.doc_address,
          });
        }else{
            req.flash('success');
            res.redirect('/psychonist')
        }
      }
    );
  }
});

module.exports = router;
