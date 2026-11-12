const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function runBackupAndAudit() {
  const atlasUri = process.env.ATLAS_MONGO_URI || process.env.MONGO_URI;
  if (!atlasUri) {
    throw new Error("No ATLAS_MONGO_URI or MONGO_URI found in environment");
  }

  console.log("Connecting to MongoDB Atlas...");
  const conn = await mongoose.connect(atlasUri, {
    serverSelectionTimeoutMS: 15000,
  });
  console.log(`Connected successfully to database: ${conn.connection.name} at host ${conn.connection.host}`);

  const db = mongoose.connection.db;
  const collectionsList = await db.listCollections().toArray();
  const collectionNames = collectionsList.map(c => c.name);
  console.log(`Found ${collectionNames.length} collections:`, collectionNames);

  const backupData = {
    timestamp: new Date().toISOString(),
    database: conn.connection.name,
    collections: {}
  };

  for (const name of collectionNames) {
    const docs = await db.collection(name).find({}).toArray();
    backupData.collections[name] = docs;
    console.log(`- Collection "${name}": ${docs.length} documents dumped`);
  }

  const timestamp = Date.now();
  const backupDirs = [
    path.join(__dirname, '../backups'),
    path.join(__dirname, '../../backups')
  ];

  for (const dir of backupDirs) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const backupFile = path.join(dir, `atlas_full_backup_${timestamp}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2), 'utf-8');
    console.log(`Saved backup to ${backupFile}`);
  }

  // Audit data
  const users = backupData.collections['users'] || [];
  const collegeStudents = backupData.collections['collegestudents'] || [];
  const books = backupData.collections['books'] || [];
  const rentals = backupData.collections['rentals'] || [];
  const transactions = backupData.collections['transactions'] || [];
  const emailOutbox = backupData.collections['emailoutboxes'] || [];
  const notifications = backupData.collections['notifications'] || [];

  console.log('\n========================================');
  console.log('         DATABASE AUDIT SUMMARY         ');
  console.log('========================================');
  console.log(`Total Users:            ${users.length}`);
  console.log(`Total College Students: ${collegeStudents.length}`);
  console.log(`Total Books:            ${books.length}`);
  console.log(`Total Rentals:          ${rentals.length}`);
  console.log(`Total Transactions:     ${transactions.length}`);
  console.log(`Total Email Outbox:     ${emailOutbox.length}`);
  console.log(`Total Notifications:    ${notifications.length}`);

  // Test accounts vs genuine accounts
  const testUsers = [];
  const genuineUsers = [];

  users.forEach(u => {
    const email = (u.email || '').toLowerCase();
    const name = (u.name || '').toLowerCase();
    const isTest = /test|mock|dummy|example|cypress|playwright|temp/i.test(email) ||
                   /test|dummy|tester/i.test(name) ||
                   u.isTest === true;
    if (isTest && !/librarian\.test\.payment@univ\.edu/i.test(email)) {
      testUsers.push(u);
    } else {
      genuineUsers.push(u);
    }
  });

  console.log('\n--- Users Breakdown ---');
  console.log(`Genuine accounts: ${genuineUsers.length}`);
  console.log(`Test/temporary accounts: ${testUsers.length}`);
  
  const genuineStudents = genuineUsers.filter(u => u.role === 'student');
  const admins = genuineUsers.filter(u => u.role === 'admin');
  const librarians = genuineUsers.filter(u => u.role === 'librarian');
  console.log(`  - Students:   ${genuineStudents.length}`);
  console.log(`  - Admins:     ${admins.length}`);
  console.log(`  - Librarians: ${librarians.length}`);

  if (testUsers.length > 0) {
    console.log('\nIdentified Test Users:');
    testUsers.forEach(u => {
      console.log(`  - [ID: ${u._id}] ${u.email} | Name: ${u.name} | Role: ${u.role} | USN: ${u.usn || 'none'}`);
    });
  }

  // Blockchain references in rentals
  const onChainRentals = rentals.filter(r => r.contractTxHash || r.onChainRentalId !== undefined && r.onChainRentalId !== null);
  console.log('\n--- Blockchain Records in Rentals ---');
  console.log(`Total Rentals with on-chain record: ${onChainRentals.length} out of ${rentals.length}`);
  onChainRentals.forEach(r => {
    console.log(`  - Rental ID: ${r._id} | onChainRentalId: ${r.onChainRentalId} | TxHash: ${r.contractTxHash} | Status: ${r.status}`);
  });

  await mongoose.disconnect();
  console.log('\nDatabase disconnect clean. Audit and backup completed successfully.');
}

runBackupAndAudit().catch(err => {
  console.error("Backup & Audit error:", err);
  process.exit(1);
});
