const jwt = require("jsonwebtoken");
const config = require("config");

module.exports = function (req, res, next) {
  //getting the token from the response header
  const token = req.header("x-auth-token");

  //check if there is no token
  if (!token) {
    return res.status(401).json({ msg: "Authorization denied" });
  }

  //verify the token
  try {
    const decoded = jwt.verify(token, config.get("jwtSecret"));
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: "Invalid token" });
  }
};
