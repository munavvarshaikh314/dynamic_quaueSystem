const express = require("express");
const router = express.Router();
const Owner = require("../models/Owner");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// REGISTER (only first time setup)
router.post("/setup", async (req, res) => {
  const exists = await Owner.findOne();
  if (exists) return res.status(400).json({ message: "Owner already exists" });

  const hashed = await bcrypt.hash(req.body.password, 10);

  await Owner.create({
    email: req.body.email,
    password: hashed
  });

  res.json({ message: "Owner account created" });
});

// LOGIN
router.post("/login", async (req, res) => {
  const owner = await Owner.findOne({ email: req.body.email });
  if (!owner) return res.status(400).json({ message: "Invalid credentials" });

  const match = await bcrypt.compare(req.body.password, owner.password);
  if (!match) return res.status(400).json({ message: "Invalid credentials" });

  const token = jwt.sign(
    { id: owner._id },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({ token });
});

module.exports = router;