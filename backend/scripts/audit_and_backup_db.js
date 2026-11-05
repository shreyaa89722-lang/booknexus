const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/user');
const Rental = require('../models/rental');
const Transaction = require('../models/transaction');
const Notification = require('../models/notification');

async function runAudit() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bookhive';
  console.log(`Connecting to MongoDB at ${mongoUri}...`);
  await mongoose.connect(mongoUri);

  console.log('Connected to MongoDB.');

  const [users, rentals, transactions, notifications] = await Promise.all([
    User.find({}).lean(),
    Rental.find({}).lean(),
    Transaction.find({}).lean(),
    Notification.find({}).lean(),
  ]);

  console.log(`\n=== CURRENT DATABASE STATE ===`);
  console.log(`Total Users: ${users.length}`);
  console.log(`Total Rentals: ${rentals.length}`);
  console.log(`Total Transactions: ${transactions.length}`);
  console.log(`Total Notifications: ${notifications.length}`);

  // Save full backup
  const timestamp = Date.now();
  const backupDir = path.join(__dirname, '../backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const backupPath = path.join(backupDir, `db_full_backup_${timestamp}.json`);
  const backupData = {
    timestamp: new Date().toISOString(),
    users,
    rentals,
    transactions,
    notifications,
  };
  fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2), 'utf-8');
  console.log(`\nFull database backup successfully created at: ${backupPath}`);

  // Identify genuine users vs test users
  const genuineUsers = [];
  const testUsers = [];
  users.forEach(u => {
    const isTest = /test|mock|example/i.test(u.email) && !/librarian\.test\.payment@univ\.edu/i.test(u.email);
    if (isTest) {
      testUsers.push(u);
    } else {
      genuineUsers.push(u);
    }
  });

  console.log(`\n=== USERS AUDIT ===`);
  console.log(`Genuine accounts: ${genuineUsers.length}`);
  console.log(`Test accounts: ${testUsers.length}`);
  console.log(`Genuine Students: ${genuineUsers.filter(u => u.role === 'student').length}`);
  console.log(`Admins: ${genuineUsers.filter(u => u.role === 'admin').length}`);
  console.log(`Librarians: ${genuineUsers.filter(u => u.role === 'librarian').length}`);

  // Identify test rentals
  const testUserIds = new Set(testUsers.map(u => u._id.toString()));
  // Also check if rentals reference test students or test books
  const testRentals = rentals.filter(r => {
    const renterId = r.renter ? r.renter.toString() : '';
    const ownerId = r.owner ? r.owner.toString() : '';
    return testUserIds.has(renterId) || testUserIds.has(ownerId);
  });
  const genuineRentals = rentals.filter(r => !testRentals.includes(r));

  console.log(`\n=== RENTALS AUDIT ===`);
  console.log(`Genuine rentals: ${genuineRentals.length}`);
  console.log(`Test rentals: ${testRentals.length}`);

  // Identify test transactions
  const testTransactions = transactions.filter(t => {
    const userId = t.user ? t.user.toString() : '';
    const ref = t.transactionRef || '';
    return testUserIds.has(userId) || ref.startsWith('TXN-TEST');
  });
  const genuineTransactions = transactions.filter(t => !testTransactions.includes(t));

  console.log(`\n=== TRANSACTIONS AUDIT ===`);
  console.log(`Genuine transactions: ${genuineTransactions.length}`);
  console.log(`Test transactions: ${testTransactions.length}`);

  // Identify notifications
  const testNotifications = notifications.filter(n => {
    const email = n.userEmail || '';
    return /test|univ\.edu|mock/i.test(email) && !/librarian\.test\.payment@univ\.edu/i.test(email);
  });
  const genuineNotifications = notifications.filter(n => !testNotifications.includes(n));

  console.log(`\n=== NOTIFICATIONS AUDIT ===`);
  console.log(`Genuine notifications: ${genuineNotifications.length}`);
  console.log(`Test notifications: ${testNotifications.length}`);

  await mongoose.disconnect();
  console.log('\nAudit complete.');
}

runAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
