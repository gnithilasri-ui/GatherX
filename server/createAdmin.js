require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const email = "admin@eventhub.edu";
    const password = "password123";

    const existingAdmin = await User.findOne({ email });

    if (existingAdmin) {
      existingAdmin.role = "admin";
      await existingAdmin.save();

      console.log("Admin account already exists. Role updated to admin.");
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);

      await User.create({
        name: "EventHub Admin",
        email,
        password: hashedPassword,
        role: "admin"
      });

      console.log("Admin account created successfully.");
    }

    console.log("Email: admin@eventhub.edu");
    console.log("Password: password123");

    await mongoose.disconnect();
  } catch (error) {
    console.error("Admin creation failed:", error.message);
    process.exit(1);
  }
}

createAdmin();