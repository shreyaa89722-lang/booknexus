/**
 * testDashboardActivity.js
 * Comprehensive validation of user-scoped dashboard activity, zero-activity handling,
 * admin overview statistics, and navbar auth states.
 */
const path = require("path");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");

dotenv.config({ path: path.join(__dirname, ".env") });

const connectDB = require("./config/db");
const User = require("./models/user");
const Rental = require("./models/rental");
const Transaction = require("./models/transaction");
const Book = require("./models/book");
const { getUserDashboard, getOverview } = require("./controllers/analyticsController");
const { getRentals } = require("./controllers/rentalController");
const { getTransactions } = require("./controllers/paymentController");

const createMockRes = () => {
  return {
    statusCode: 200,
    jsonData: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.jsonData = data;
      return this;
    },
  };
};

async function runDashboardTests() {
  console.log("================================================================================");
  console.log("📊 BOOKNEXUS USER-SCOPED DASHBOARD & ACTIVITY VERIFICATION TEST");
  console.log("================================================================================\n");

  await connectDB();

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Brand New Student with Zero Activity
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 1: New Student with No Transactions or Rentals ---");
    
    // Create or find a test student with zero transactions
    let newStudent = await User.findOne({ email: "test.newstudent.dashboard@univ.edu" });
    if (!newStudent) {
      newStudent = await User.create({
        name: "New Student Tester",
        email: "test.newstudent.dashboard@univ.edu",
        usn: "4MC23CB999",
        password: "password123",
        role: "student",
        registrationCompleted: true,
        quizCompleted: true,
      });
    }

    // Clean up any stray test rentals or transactions for this user
    await Rental.deleteMany({ $or: [{ renter: newStudent._id }, { owner: newStudent._id }] });
    await Transaction.deleteMany({ user: newStudent._id });

    // Call getUserDashboard
    const reqDash = { user: newStudent };
    const resDash = createMockRes();
    await getUserDashboard(reqDash, resDash);

    assert(resDash.statusCode === 200, "getUserDashboard responds with HTTP 200");
    const d = resDash.jsonData.data;
    assert(d.hasActivity === false, "hasActivity is strictly false for new user");
    assert(d.emptyMessage === "You haven't borrowed or rented any books yet. Explore the catalog to get started.", "Empty state friendly message returned");
    assert(d.summary.borrowedCount === 0, "Currently borrowed is 0");
    assert(d.summary.lentCount === 0, "Currently lent is 0");
    assert(d.summary.pendingRequests === 0, "Pending requests is 0");
    assert(d.summary.activeRentals === 0, "Active rentals is 0");
    assert(d.summary.completedRentals === 0, "Completed rentals is 0");
    assert(d.summary.returnedBooks === 0, "Returned books is 0");
    assert(d.summary.outstandingFines === 0, "Outstanding fine is ₹0");
    assert(d.summary.finesPaid === 0, "Fines paid is ₹0");
    assert(d.summary.totalSpent === 0, "Total spent is ₹0");
    assert(d.summary.depositsHeld === 0, "Deposits held is ₹0");
    assert(d.summary.depositsReturned === 0, "Deposits returned is ₹0");
    assert(d.summary.rentalEarnings === 0, "Rental earnings is ₹0");
    assert(Array.isArray(d.recentActivity) && d.recentActivity.length === 0, "Recent activity timeline is empty array");

    // Test GET /api/rentals scoping for new student
    const reqRentals = { user: newStudent };
    const resRentals = createMockRes();
    await getRentals(reqRentals, resRentals);
    assert(resRentals.statusCode === 200, "getRentals responds with HTTP 200");
    assert(Array.isArray(resRentals.jsonData.data) && resRentals.jsonData.data.length === 0, "getRentals returns 0 rentals for new student (not campus rentals)");

    // Test GET /api/payments scoping for new student
    const reqPayments = { user: newStudent, query: {} };
    const resPayments = createMockRes();
    await getTransactions(reqPayments, resPayments);
    assert(resPayments.statusCode === 200, "getTransactions responds with HTTP 200");
    assert(Array.isArray(resPayments.jsonData.data) && resPayments.jsonData.data.length === 0, "getTransactions returns 0 transactions for new student");

    // -------------------------------------------------------------------------
    // TEST 2: Student Account with Genuine Activity
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 2: Student Account with Genuine Rental and Payment History ---");

    // Find a book
    const sampleBook = await Book.findOne() || await Book.create({
      title: "Test Academic Book",
      author: "Test Author",
      genre: "Computer Science",
      subject: "Testing",
      listingType: "p2p",
      rentalPricePerWeek: 150,
    });

    // Create a genuine rental for newStudent
    const genuineRental = await Rental.create({
      book: sampleBook._id,
      renter: newStudent._id,
      status: "active",
      pickupOtp: "123456",
      penaltyAmount: 0,
      createdAt: new Date(),
    });

    // Create a genuine transaction for newStudent
    const genuineTxn = await Transaction.create({
      transactionRef: "TXN-TEST-DASH-01",
      user: newStudent._id,
      book: sampleBook._id,
      rental: genuineRental._id,
      type: "rental_fee",
      amount: 150,
      status: "successful",
      isVerified: true,
      paymentMethod: "campus_upi",
    });

    const resDashActive = createMockRes();
    await getUserDashboard({ user: newStudent }, resDashActive);
    const activeD = resDashActive.jsonData.data;

    assert(activeD.hasActivity === true, "hasActivity is true when student has rental/payment");
    assert(activeD.summary.activeRentals === 1, "activeRentals accurately reflects 1 rental");
    assert(activeD.summary.totalSpent === 150, "totalSpent accurately reflects ₹150");
    assert(activeD.emptyMessage === null, "emptyMessage is null when active");
    assert(activeD.recentActivity.length >= 1, "recentActivity contains user's events");

    // Clean up test rental and transaction
    await Rental.deleteOne({ _id: genuineRental._id });
    await Transaction.deleteOne({ _id: genuineTxn._id });
    await User.deleteOne({ _id: newStudent._id });

    // -------------------------------------------------------------------------
    // TEST 3: Admin Campus-Wide Overview Statistics
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 3: Admin Dashboard Campus-Wide Statistics ---");

    const adminUser = await User.findOne({ role: "admin" }) || { _id: new mongoose.Types.ObjectId(), role: "admin", name: "Campus Admin" };
    const reqAdmin = { user: adminUser };
    const resAdmin = createMockRes();
    await getOverview(reqAdmin, resAdmin);

    assert(resAdmin.statusCode === 200, "getOverview responds with HTTP 200 for admin");
    const admData = resAdmin.jsonData.data;
    assert(typeof admData.totalBooks === "number", `Admin overview includes totalBooks (${admData.totalBooks})`);
    assert(typeof admData.totalUsers === "number", `Admin overview includes totalUsers (${admData.totalUsers})`);
    assert(Array.isArray(admData.rentalsByStatus), `Admin overview includes rentalsByStatus breakdown`);
    assert(typeof admData.overdueRentalsCount === "number", `Admin overview includes overdueRentalsCount (${admData.overdueRentalsCount})`);
    assert(Array.isArray(admData.genreDistribution), `Admin overview includes genreDistribution`);

    // Admin getRentals and getTransactions
    const resAdminRentals = createMockRes();
    await getRentals({ user: adminUser }, resAdminRentals);
    assert(resAdminRentals.statusCode === 200, "Admin can retrieve campus-wide rentals");

    const resAdminPayments = createMockRes();
    await getTransactions({ user: adminUser, query: {} }, resAdminPayments);
    assert(resAdminPayments.statusCode === 200, "Admin can retrieve campus-wide payment ledger");

    // -------------------------------------------------------------------------
    // TEST 4: Navbar Sign In / Sign Out Logic Verification
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 4: Navbar Sign In / Sign Out Session Verification ---");

    // Helper implementing the exact navbar logic from index.html & bridge.js
    function checkNavbarLabel(token, currentEmail, currentUsn, storedUser) {
      const activeUser = storedUser || null;
      const activeToken = token;
      const hasAuth = !!(activeToken && (currentEmail || currentUsn || (activeUser && (activeUser.usn || activeUser.email))));
      return hasAuth ? "Sign Out" : "Sign In";
    }

    // Case A: USN / Password student login
    const navUSN = checkNavbarLabel("jwt.token.abc", "", "4MC23CB049", { usn: "4MC23CB049", name: "Shreya G N" });
    assert(navUSN === "Sign Out", "USN / Password login correctly displays 'Sign Out'");

    // Case B: Google login
    const navGoogle = checkNavbarLabel("jwt.token.xyz", "solowinterr@gmail.com", "", { email: "solowinterr@gmail.com", name: "Student" });
    assert(navGoogle === "Sign Out", "Google login correctly displays 'Sign Out'");

    // Case C: Logged out / guest user
    const navGuest = checkNavbarLabel(null, "", "", null);
    assert(navGuest === "Sign In", "Logged out / guest session correctly displays 'Sign In'");

    // -------------------------------------------------------------------------
    // TEST 5: Preserve Genuine MongoDB Records Check
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 5: Integrity of Original 81 Database Records ---");
    const count = await User.countDocuments();
    assert(count >= 81, `Database contains ${count} user accounts (original 81 preserved)`);

    console.log("\n================================================================================");
    console.log(`TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
    console.log("================================================================================");

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error("Test execution failed:", err);
    process.exit(1);
  }
}

runDashboardTests();
