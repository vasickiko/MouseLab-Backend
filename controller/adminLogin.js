const { findAdmin } = require("../Models/Admin");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const login = async (req, res) => {
    try{
        const { username, password } = req.body;
        const admin = await findAdmin(username);
        if(!admin) return res.status(401).json({message: "Invalid credentials"});

        const isPasswordCorrect = await bcrypt.compare(password, admin.password);

        if (!isPasswordCorrect) return res.status(401).json({ message: "Invalid username or password" });
         
        const payload = {
            id: admin._id,
            username: admin.username
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });
        
        res.json({ token });
    }catch(err){
        res.status(500).json({message: "Error logging in"});
    }
}

module.exports = { login }