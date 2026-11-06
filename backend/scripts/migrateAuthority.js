const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

async function migrateAuthority() {
  await mongoose.connect(process.env.ATLAS_MONGO_URI || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/bookhive");
  const User = mongoose.model("User", new mongoose.Schema({}, { strict: false }));

  const totalBefore = await User.countDocuments();
  console.log("Total users before:", totalBefore);

  // Set librarian role and librarianId
  const libRes = await User.updateOne(
    { email: "librarian.test.payment@univ.edu" },
    { $set: { role: "librarian", librarianId: "STAFF-LIB-01" } }
  );
  console.log("Updated librarian:", libRes);

  // Set adminId
  const adminRes = await User.updateOne(
    { email: "admin@booknexus.com" },
    { $set: { role: "admin", adminId: "ADMIN001" } }
  );
  console.log("Updated admin:", adminRes);

  const totalAfter = await User.countDocuments();
  console.log("Total users after:", totalAfter);

  const admin = await User.findOne({ email: "admin@booknexus.com" }).lean();
  console.log("Verified Admin:", { email: admin.email, role: admin.role, adminId: admin.adminId, usn: admin.usn });

  const lib = await User.findOne({ email: "librarian.test.payment@univ.edu" }).lean();
  console.log("Verified Librarian:", { email: lib.email, role: lib.role, librarianId: lib.librarianId, usn: lib.usn });

  await mongoose.disconnect();
}

migrateAuthority().catch(console.error);

