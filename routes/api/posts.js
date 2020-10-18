const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const auth = require("../../middleware/auth");
const Profile = require("../../models/Profile");
const Users = require("../../models/Users");
const Post = require("../../models/Post");
const checkObjectId = require("../../middleware/checkObjectId");

//ROUTE POST api/posts
//DESC  create a posts
//ACCES  pvt
router.post(
  "/",
  [auth, [check("text", "Text field can not be empty").not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const user = await Users.findById(req.user.id).select("-password");
      const newPost = new Post({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      });
      //wrapping the post in a variable to res.json it
      const post = await newPost.save();
      res.json(post);
    } catch (error) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
);

//ROUTE GET api/posts
//DESC  get all posts
//ACCES  pvt
router.get("/", auth, async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 });
    res.json(posts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

//ROUTE GET api/posts/:id
//DESC  get post by id
//ACCES  pvt
router.get("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).sort({ date: -1 });
    //if post does not exist
    if (!post) {
      res.status(404).json("Post not found");
    }
    res.json(post);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      res.status(404).json("Post not found");
    }
    res.status(500).send("Server error");
  }
});

//ROUTE DELETE api/posts
//DESC  delete a posts
//ACCES  pvt
router.delete("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    // Check user
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "User not authorized" });
    }

    await post.remove();

    res.json({ msg: "Post removed" });
  } catch (err) {
    console.error(err.message);

    res.status(500).send("Server Error");
  }
});

//ROUTE PUT api/posts/like/:id
//DESC  like a posts
//ACCES  pvt
router.put("/like/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    //check if you already liked the post
    if (
      post.likes.filter((like) => like.user.toString() === req.user.id).length >
      0
    ) {
      return res.status(400).json({ msg: "You already liked this post" });
    }
    //if not
    post.likes.unshift({ user: req.user.id });

    await post.save();
    res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

//ROUTE PUT api/posts/unlike/:id
//DESC  unlike a posts
//ACCES  pvt
router.put("/unlike/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    //check if you haven't liked the post,obviousely you can not unlike it then
    if (
      post.likes.filter((like) => like.user.toString() === req.user.id)
        .length === 0
    ) {
      return res.status(400).json({ msg: "You haven't liked this post" });
    }
    //Get the right index of the like to remove
    const removeIndex = post.likes
      .map((like) => like.user.toString())
      .indexOf(req.user.id);
    //Splice it out of the likes array
    post.likes.splice(removeIndex, 1);
    //Save and res json it again
    await post.save();
    res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

//ROUTE POST api/posts/comment/:id
//DESC  comment on a posts
//ACCES  pvt
router.post(
  "/comment/:id",
  [
    auth,
    checkObjectId("id"),
    [check("text", "Text field can not be empty").not().isEmpty()],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const user = await Users.findById(req.user.id).select("-password");
      const post = await Post.findById(req.params.id);
      //constructing what the comment will consist of
      const newComment = {
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      };
      //unshift will add the comment to the beginning
      post.comments.unshift(newComment);

      //res.json it
      await post.save();
      res.json(post);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
);

//ROUTE DELETE api/posts/comment/:id/comment_id
//DESC  delete a comment
//ACCES  pvt
router.delete("/comment/:id/:comment_id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    //Take out the right comment to delete
    const comment = post.comments.find(
      (comment) => comment.id === req.params.comment_id
    );

    //Does the comment exist?
    if (!comment) {
      return res.status(404).json({ msg: "Comment can not be found" });
    }

    //Look if it is the right user
    if (comment.user.toString() !== req.user.id) {
      return res
        .status(401)
        .json({ msg: "You are not Authorized to delete this comment" });
    }

    //Get the right index of the like to remove
    const removeIndex = post.comments
      .map((comment) => comment.user.toString())
      .indexOf(req.user.id);

    //Splice it out of the likes array
    post.comments.splice(removeIndex, 1);

    //Save and res json it again
    await post.save();
    res.json(post.comments);
  } catch (error) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

module.exports = router;
