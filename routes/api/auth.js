const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const bcrypt = require("bcryptjs");
const Users = require("../../models/Users");
const jwt = require("jsonwebtoken");
const config = require("config");
const { check, validationResult } = require("express-validator");

//ROUTE  GET api/auth
//ACCES  all
router.get("/", auth, async (req, res) => {
  try {
    const user = await Users.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    console.error(error);
    res.status(500).send("Server Err");
  }
});

//ROUTE = POST  ,api/auth
//DESCRIPTION  = Authenticate a user & get the token
//ACCES = all

router.post(
  "/",
  [
    //VALIDATION

    check("email", "Is not a valid email;").isEmail(),
    check("password", "Password required").exists(),
  ],
  async (req, res) => {
    console.log(req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    try {
      //Check for excisting user
      let user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ errors: [{ msg: "Invalid" }] });
      }

      //compare if the password matches the given password
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(400).json({ errors: [{ msg: "Invalid" }] });
      }

      //Return JWT
      const payload = {
        user: {
          id: user.id, //mongoose does not require to use the underscore (_id) but just id
        },
      };

      jwt.sign(
        payload,
        config.get("jwtSecret"),
        { expiresIn: 360000 },
        (err, token) => {
          if (err) throw err;
          res.send({ token });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.send(500).send("Server error");
    }
  }
);

module.exports = router;
