var express = require("express");
var router = express.Router();
let dbCon = require("../../lib/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");



router.post("/login", (req, res) => {
  const { user_email, user_password } = req.body;

  if (!user_email || !user_password) {
    return res.status(400).json({ message: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน" });
  }

  const query =
    "SELECT id, user_email, user_password, user_name, role_id_fk FROM user_table WHERE user_email = ?";

  dbCon.query(query, [user_email], async (err, results) => {
    if (err) {
      console.error("เกิดข้อผิดพลาดในการค้นหาข้อมูลผู้ใช้: " + err.message);
      return res.status(500).json({ message: "มีข้อผิดพลาดในการล็อกอิน" });
    }

    if (results.length === 0) {
      return res
        .status(401)
        .json({ message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
    }

    const userData = results[0];

    try {
      const isPasswordCorrect = await bcrypt.compare(
        user_password,
        userData.user_password
      );
      if (!isPasswordCorrect) {
        return res
          .status(401)
          .json({ message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
      }

      const payload = {
        email: userData.user_email,
        id: userData.id,
        name: userData.user_name,
        role_id: userData.role_id_fk, // เพิ่มค่า role_id ใน payload
      };

      const token = jwt.sign(payload, "shhhhh", { expiresIn: "1h" });
      res
        .status(200)
        .json({ status: true, token: token });
    } catch (bcryptErr) {
      console.error(
        "เกิดข้อผิดพลาดในการเปรียบเทียบรหัสผ่าน: " + bcryptErr.message
      );
      return res.status(500).json({ message: "มีข้อผิดพลาดในการล็อกอิน" });
    }
  });
});


router.post("/register", async (req, res) => {
  const {
    user_name,
    user_password,
    first_name,
    last_name,
    user_email,
    birthday,
  } = req.body;
  if (!user_password) {
    return res.status(400).json({ message: "Password is required" });
  }
  const role_id_fk = "1";
  try {
    const hashedPassword = await bcrypt.hash(user_password, 10);
    dbCon.query(
      "INSERT INTO user_table(user_password, user_email,user_name,first_name,last_name,role_id_fk) VALUES(?,?,?,?,?,?)",
      [
        hashedPassword,
        user_email,
        user_name,
        first_name,
        last_name,
        role_id_fk,
      ],
      (err, results, fields) => {
        if (err) {
          console.log("Error : ", err);
          return res.status(400).send();
        }
        const userId = results.insertId;
        dbCon.query(
          "INSERT INTO patient_details(patient_id_fk, birthday) VALUES(?,?)",
          [userId, birthday],
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



router.post("/auth", (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    console.log(token);
    var decoded = jwt.verify(token, "shhhhh");
    res.json({ status: "ok", decoded });
  } catch (error) {
    console.log(token);
    res.json({ status: "error", msg: error.message, token });
  }
});


const storage = multer.diskStorage({
  destination: "./upload/images",
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const fileExtension = path.extname(file.originalname);
    const newFilename = `${file.fieldname}_${uniqueSuffix}${fileExtension}`;
    cb(null, newFilename);
  },
});

const upload = multer({
  storage: storage,
});

router.post("/paymentrequest", upload.single("slip"), async (req, res) => {
  const { psychonist_appointments_id, user_id } = req.body;
  const slipFileName = req.file.filename;
  try {
    dbCon.query(
      "INSERT INTO payment_table(psychologist_appointments_id , patient_id  , slip) VALUES(?,?,?)",
      [psychonist_appointments_id, user_id, slipFileName],
      (err, results, fields) => {
        if (err) {
          console.log("Error : ", err);
          return res.status(400).send();
        }
        return res.status(201).json({ message: "Success" });
      }
    );
  } catch (err) {
    console.log(err);
    return res.status(500).send();
  }
});


module.exports = router;
