require("dotenv").config();
const { expressjwt } = require("express-jwt");
const express = require("express");
const connectDB = require("./config/db");
const cors = require("cors");
const { createTwoAdmins } = require("./Models/Admin");
const path = require("path");

const upload = require("./multer/upload");
const { login } = require("./controller/adminLogin");
const { createMouse, getAllMice } = require("./controller/miceController");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/get/mice", getAllMice )

app.post("/login", login);

const requireAuth = (req, res, next) => {
  if (!req.auth?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};
app.use(
  expressjwt({
    secret: process.env.JWT_SECRET,
    algorithms: ["HS256"],
  })
);


app.post("/mice", requireAuth, upload.single("image"), createMouse);


const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    await createTwoAdmins();

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.log("Error starting server:", err);
  }
};

startServer();