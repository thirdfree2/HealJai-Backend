var express = require("express");
var router = express.Router();
let dbCon = require("../../lib/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");

router.post("/login", (req, res) => {
  const { Email, Password } = req.body;

  if (!Email || !Password) {
    return res.status(400).json({ message: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน" });
  }

  const query1 =
    "SELECT UserID, Email, Password, UserName FROM app_users WHERE Email = ?";

  dbCon.query(query1, [Email], async (err, results) => {
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
        Password,
        userData.Password
      );
      if (!isPasswordCorrect) {
        return res
          .status(401)
          .json({ message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
      }

      // เรียกดู UserGroupID จาก app_user_roles
      const query2 = "SELECT UserGroupID FROM app_user_roles WHERE UserID = ?";

      dbCon.query(query2, [userData.UserID], (err, roleResults) => {
        if (err) {
          console.error("เกิดข้อผิดพลาดในการค้นหา UserGroupID: " + err.message);
          return res.status(500).json({ message: "มีข้อผิดพลาดในการล็อกอิน" });
        }

        const roleData = roleResults[0];

        const payload = {
          email: userData.Email,
          id: userData.UserID,
          name: userData.UserName,
          role_id: roleData ? roleData.UserGroupID : null, // ตรวจสอบว่ามี roleData หรือไม่
        };

        const token = jwt.sign(payload, "shhhhh", { expiresIn: "1h" });
        res.status(200).json({ status: true, token: token });
      });
    } catch (bcryptErr) {
      console.error(
        "เกิดข้อผิดพลาดในการเปรียบเทียบรหัสผ่าน: " + bcryptErr.message
      );
      return res.status(500).json({ message: "มีข้อผิดพลาดในการล็อกอิน" });
    }
  });
});

router.post("/register", async (req, res) => {
  const { UserName, Password, FirstName, LastName, Email, BirthDay, Tel } =
    req.body;
  if (!Password) {
    return res.status(400).json({ message: "Password is required" });
  }
  try {
    const hashedPassword = await bcrypt.hash(Password, 10);
    dbCon.query(
      "INSERT INTO app_users(Password, Email,UserName,FirstName,LastName,BirthDay,Tel) VALUES(?,?,?,?,?,?,?)",
      [hashedPassword, Email, UserName, FirstName, LastName, BirthDay, Tel],
      (err, results, fields) => {
        if (err) {
          console.log("Error : ", err);
          return res.status(400).send();
        }

        const userId = results.insertId;
        dbCon.query(
          "INSERT INTO app_user_roles(UserID, UserGroupID) VALUES(?,3)",
          [userId, BirthDay],
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

const storage = multer.diskStorage({
  destination: "upload/slip",
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
  const slipFileName = req.file.path;
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
