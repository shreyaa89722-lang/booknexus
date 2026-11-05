/**
 * TEST USER-SPECIFIC DASHBOARD ISOLATION & ZERO-ACTIVITY VERIFICATION
 */
const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, ".env") });

const connectDB = require("./config/db");
const User = require("./models/User");
const Rental = require("./models/Rental");
const Transaction = require("./models/transaction");
const { getUserDashboard, getOverview } = require("./controllers/analyticsController");

const mockRes = () => {
  return {
    statusCode: 200,
    jsonData: null,
    status(c) { this.statusCode = c; return this; },
    json(d) { this.jsonData = d; return this; }
  };
};

async function run() {
  await connectDB();
  console.log("Connected to DB for Dashboard testing.");

  // 1. Create a dummy test student with NO activity
  const testEmail = `zero_activity_${Date.now()}@test.edu`;
  const zeroUser = await User.create({
    name: "Zero Activity Student",
    email: testEmail,
    password: "Password123!",
    usn: "ZERO" + Date.now().toString().slice(-6),
    role: "student",
    registrationCompleted: true,
    quizCompleted: true,
  });

  const reqZero = { user: zeroUser };
  const resZero = mockRes();
  await getUserDashboard(reqZero, resZero, (err) => { if (err) throw err; });

  const zeroData = resZero.jsonData?.data;
  console.log("Zero user dashboard result:", {
    hasActivity: zeroData?.hasActivity,
    summary: zeroData?.summary,
    emptyMessage: zeroData?.emptyMessage,
  });

  const passZeroCounts =
    zeroData?.hasActivity === false &&
    zeroData?.summary.borrowedCount === 0 &&
    zeroData?.summary.lentCount === 0 &&
    zeroData?.summary.pendingRequests === 0 &&
    zeroData?.summary.activeRentals === 0 &&
    zeroData?.summary.completedRentals === 0 &&
    zeroData?.summary.returnedBooks === 0 &&
    zeroData?.summary.outstandingFines === 0 &&
    zeroData?.summary.finesPaid === 0 &&
    zeroData?.summary.totalSpent === 0 &&
    zeroData?.summary.depositsHeld === 0 &&
    zeroData?.summary.depositsReturned === 0 &&
    zeroData?.summary.rentalEarnings === 0 &&
    typeof zeroData?.emptyMessage === "string";

  console.log("Zero activity test:", passZeroCounts ? "✅ PASS" : "❌ FAIL");

  // Clean up test zero user
  await User.deleteOne({ _id: zeroUser._id });

  // 2. Test Admin Overview
  const reqAdmin = { user: { role: "admin" } };
  const resAdmin = mockRes();
  await getOverview(reqAdmin, resAdmin, (err) => { if (err) throw err; });
  const passAdmin = resAdmin.statusCode === 200 && resAdmin.jsonData?.success === true;
  console.log("Admin overview test:", passAdmin ? "✅ PASS" : "❌ FAIL");

  if (passZeroCounts && passAdmin) {
    console.log("ALL DASHBOARD BACKEND TESTS PASSED!");
  } else {
    process.exit(1);
  }

  process.exit(0);
}

run().catch((e) => {
  console.error("Test failed:", e);
  process.exit(1);
});

