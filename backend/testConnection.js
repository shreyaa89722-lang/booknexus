require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const User = require("./models/User");

async function run() {
  await connectDB();
  const count = await User.countDocuments();
  console.log(`📊 Users in database: ${count}`);

  const student = await User.findOne({ email: "abdur56562541@gmail.com" }).select("+password");
  if (student) {
    const verified = await student.comparePassword("4MC23CB001");
    console.log(`🔐 Login test for ${student.email}: ${verified ? 'SUCCESS' : 'FAILED'}`);
  }

  console.log("✅ Connection test completed successfully.");
  await mongoose.disconnect();
  process.exit(0);
}

run();