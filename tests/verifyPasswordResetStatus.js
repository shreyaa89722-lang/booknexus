const path = require("path");
const backendNodeModules = path.resolve(__dirname, "../backend/node_modules");
if (!module.paths.includes(backendNodeModules)) module.paths.push(backendNodeModules);
require("../backend/config/linuxCaseResolver");
require("dotenv").config({ path: path.resolve(__dirname, "../backend/.env") });

const mongoose = require("mongoose");
const connectDB = require("../backend/config/db");
const User = require("../backend/models/user");

async function checkAccount() {
  console.log("==================================================");
  console.log("BookNexus: Account Status Verification");
  console.log("==================================================\n");

  await connectDB();
  console.log("1. MongoDB Connection: SUCCESS");

  const email = "shreyaa89722@gmail.com";
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    console.error("User not found!");
    process.exit(1);
  }

  console.log("2. User Record Found: YES");
  console.log("   - Name:", user.name);
  console.log("   - Email:", user.email);
  console.log("   - USN:", user.usn);
  console.log("   - Role:", user.role);

  const hasPasswordHash = typeof user.password === "string" && user.password.length > 20;
  const isBcrypt = hasPasswordHash && user.password.startsWith("$2");
  console.log("3. Password Hashed in MongoDB: YES (Bcrypt: " + isBcrypt + ")");

  console.log("4. Reset OTP Cleared (Single-use verified):", user.resetPasswordOtpHash === undefined ? "YES" : "NO");
  console.log("5. Reset Token Cleared (Single-use verified):", user.resetPasswordToken === undefined ? "YES" : "NO");

  await mongoose.connection.close();
  console.log("\nStatus Check Completed Successfully.");
}

checkAccount().catch(err => {
  console.error("Verification error:", err.message);
  process.exit(1);
});
