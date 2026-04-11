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

// const createAdmin = async () => {
//   try {
//     const existingAdmin = await Admin.findOne({ username: "admin" });

//     if (existingAdmin) {
//       console.log("Admin already exists");
//       return;
//     }

//     const hashedPassword = await bcrypt.hash("admin123", 10);

//     const admin = new Admin({
//       username: "admin",
//       password: hashedPassword,
//     });

//     await admin.save();
    
//     console.log("Admin created");
//   } catch (err) {
//     console.log("Error creating admin:", err);
//   }
// };


const createTwoAdmins = async () => {
  try { 

    const existingAdmin1 = await Admin.findOne({ username: "admin" });
    const existingAdmin2 = await Admin.findOne({ username: "admin2" });

    if (existingAdmin1 || existingAdmin2) {
      console.log("Admins ready to log in");
      return;
    }

    const adminsData = [
      { username: "admin", password: "sdKASJJidj2Sj29SJkjs" },
      { username: "admin2", password: "SKHjd828as892Sjif2h" },
    ];

    for (const adminData of adminsData) {
      const hashedPassword = await bcrypt.hash(adminData.password, 10);

      const admin = new Admin({
        username: adminData.username,
        password: hashedPassword,
    });

    await admin.save();
    
    console.log("Admin created");
    }
  } catch (err) {
    console.log("Error creating admin:", err);
  }
};




module.exports = { createAdmin, findAdmin };