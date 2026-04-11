const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const Admin = mongoose.model("Admin", adminSchema);

const findAdmin = async (username) => {
  return await Admin.findOne({ username });
};

const createAdmin = async () => {
  try {
    const existingAdmin = await Admin.findOne({ username: "admin" });

    if (existingAdmin) {
      console.log("Admin already exists");
      return;
    }

    const hashedPassword = await bcrypt.hash("admin123", 10);

    const admin = new Admin({
      username: "admin",
      password: hashedPassword,
    });

    await admin.save();
    
    console.log("Admin created");
  } catch (err) {
    console.log("Error creating admin:", err);
  }
};

module.exports = { createAdmin, findAdmin };