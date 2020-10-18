const express = require("express");
const router = express.Router();
const gravatar = require("gravatar");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");
const { check, validationResult } = require("express-validator");
const User = require("../../models/Users");

//ROUTE = POST  ,api/users
//DESCRIPTION  = Register a user
//ACCES = all

router.post(
  "/",
  [
    //VALIDATION
    check("name", "Name field can not be empty").not().isEmpty(),
    check("email", "Is not a valid email;").isEmail(),
    check(
      "password",
      "Password needs to be a minimum of 6 characters"
    ).isLength({ min: 6 }),
  ],
  async (req, res) => {
    console.log(req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;
    try {
      //Check for excisting user
      let user = await User.findOne({ email });
      if (user) {
        return res
          .status(400)
          .json({ errors: [{ msg: "User already exist" }] });
      }

      //Get the gravatar for that user
      const avatar = gravatar.url(email, {
        s: "200",
        r: "pg",
        d: "mm",
      });
      user = new User({
        name,
        email,
        password,
        avatar,
      });

      //Encrypt the password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      await user.save(); //Saves theb user in  the database

      //Return JWT
      const payload = {
        user: {
          id: user.id, //mongoose does not require to use the underscore (_id) but just id
          name,
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
