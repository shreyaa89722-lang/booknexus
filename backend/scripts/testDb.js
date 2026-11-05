const connectDB = require("../config/db");
const User = require("../models/User");

async function test() {
  await connectDB();
  const count = await User.countDocuments();
  console.log(`✅ Success! Database connected. Found ${count} users in DB.`);
  process.exit(0);
}

test().catch(e => {
  console.error("Test error:", e);
  process.exit(1);
});

