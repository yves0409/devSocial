const express = require("express");
const router = express.Router();
const request = require("request");
const config = require("config");

const { check, validationResult } = require("express-validator");
const auth = require("../../middleware/auth");
const Profile = require("../../models/Profile");
const Users = require("../../models/Users");
const Post = require("../../models/Post");

//ROUTE  GET api/profile/currentuser
//DESCRIPTION get only current user
//ACCES  pvt
router.get("/currentuser", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id,
    }).populate("user", ["name", "avatar"]);
    // 1) If no profile
    if (!profile) {
      return res.status(400).json({ msg: "User does not have a profile yet" });
    }
    // 2) else return the profile
    res.json(profile);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

//ROUTE  POST api/profile
//DESCRIPTION  create or update a profile
//ACCES  pvt

router.post(
  "/",
  [
    auth,
    [
      check("status", "Status is a required field").not().isEmpty(),
      check("skills", "Skills is a required field").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      company,
      website,
      location,
      bio,
      status,
      githubusername,
      skills,
      youtube,
      facebook,
      twitter,
      instagram,
      linkedin,
    } = req.body;

    //Build profile fields
    const profileFields = {};
    profileFields.user = req.user.id;
    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;
    if (status) profileFields.status = status;
    if (githubusername) profileFields.githubusername = githubusername;
    if (skills) {
      profileFields.skills = skills.split(",").map((skill) => skill.trim());
    }

    //Build social fields
    profileFields.social = {};
    if (youtube) profileFields.social.youtube = youtube;
    if (twitter) profileFields.social.twitter = twitter;
    if (facebook) profileFields.social.facebook = facebook;
    if (linkedin) profileFields.social.linkedin = linkedin;
    if (instagram) profileFields.social.instagram = instagram;

    try {
      let profile = await Profile.findOne({ user: req.user.id });

      if (profile) {
        //find profile
        await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        );
        return res.json(profile);
      }
      //Create
      profile = new Profile(profileFields);
      await profile.save();
      res.json(profile);
    } catch (error) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
);

//ROUTE  GET api/profile
//DESCRIPTION  fetch all profiles
//ACCES  public

router.get("/", async (req, res) => {
  try {
    const profiles = await Profile.find().populate("user", ["name", "avatar"]); //populate will populate the profiles with the users name and avatar
    res.json(profiles);
  } catch (error) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

//ROUTE  GET api/profile/user/:user_id
//DESCRIPTION  fetch profile by id
//ACCES  public

router.get("/user/:user_id", async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.user_id,
    }).populate("user", ["name", "avatar"]);
    if (!profile)
      return res.status(400).json({ msg: "No profile found for this user" });
    res.json(profile);
  } catch (error) {
    console.error(err.message);
    if (err.kind == "ObjectID") {
      return res.status(400).json({ msg: "No profile found for this user" });
    }
    res.status(500).send("Server error");
  }
});

//ROUTE  DELETE api/profile
//DESCRIPTION  delete a profile,post or user
//ACCES  pvt

router.delete("/", auth, async (req, res) => {
  try {
    //delete user's posts after profile has been deleted
    await Post.deleteMany({ user: req.user.id });
    //Remove profile
    await Profile.findOneAndRemove({ user: req.user.id });
    //Remove User
    await Users.findOneAndRemove({ _id: req.user.id });

    res.json({ msg: "User deleted" });
  } catch (error) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

//ROUTE  PUT api/profile/experience
//DESCRIPTION  Add profile experience
//ACCES  pvt
router.put(
  "/experience",
  [
    auth,
    [
      check("title", "Title is required").not().isEmpty(),
      check("company", "Company is required").not().isEmpty(),
      check("from", "From date is required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
    } = req.body;

    const newExp = {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });
      profile.experience.unshift(newExp);
      await profile.save();
      res.json(profile);
    } catch (error) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
);

//ROUTE  DELETE api/profile/experience/:exp_id
//DESCRIPTION  delete a profile experience
//ACCES  pvt

router.delete("/experience/:exp_id", auth, async (req, res) => {
  try {
    //finding the profile
    const profile = await Profile.findOne({ user: req.user.id });
    //Get the index for the experience that we want to remove
    const removeIndex = profile.experience
      .map((item) => item.id)
      .indexOf(req.params.exp_id);
    //splicing it up and saving
    profile.experience.splice(removeIndex, 1);
    await profile.save();
    //sending back the new response
    res.json(profile);
  } catch (error) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

//ROUTE  PUT api/profile/education
//DESCRIPTION  Add profile education
//ACCES  pvt
router.put(
  "/education",
  [
    auth,
    [
      check("school", "School is required").not().isEmpty(),
      check("degree", "Degree is required").not().isEmpty(),
      check("fieldofstudy", "Field of study is required").not().isEmpty(),
      check("from", "From date is required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description,
    } = req.body;

    const newEdu = {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description,
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });
      profile.education.unshift(newEdu);
      await profile.save();
      res.json(profile);
    } catch (error) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
);

//ROUTE  DELETE api/profile/education/:edu_id
//DESCRIPTION  delete a profile education
//ACCES  pvt

router.delete("/education/:edu_id", auth, async (req, res) => {
  try {
    //finding the profile
    const profile = await Profile.findOne({ user: req.user.id });
    //Get the index for the education that we want to remove
    const removeIndex = profile.education
      .map((item) => item.id)
      .indexOf(req.params.edu_id);
    //splicing it up and saving
    profile.education.splice(removeIndex, 1);
    await profile.save();
    //sending back the new response
    res.json(profile);
  } catch (error) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

//ROUTE  GET api/profile/github/:username
//DESCRIPTION  get the user's github repositories
//ACCES  public
router.get("/github/:username", (req, res) => {
  try {
    const options = {
      uri: `https://api.github.com/users/${
        req.params.username
      }/repos?per_page=5&sort=created:asc&client_id=${config.get(
        "githubClientId"
      )}&client_secret=${config.get("githubSecret")}`,
      method: "GET",
      headers: { "user-agent": "node.js" },
    };

    request(options, (error, response, body) => {
      if (error) console.error(error);
      //If not found ...
      if (response.statusCode !== 200) {
        return res.status(400).json("Github user not found");
      }
      //When found....
      res.json(JSON.parse(body));
    });
  } catch (error) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

module.exports = router;
