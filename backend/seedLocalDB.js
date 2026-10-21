const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Book = require('./models/Book');

const EXPORT_PATH = path.join(__dirname, 'students_export.json');
const DATA_DIR = path.join(__dirname, 'data', 'db');

async function seed() {
  console.log('🚀 Checking/Starting Local MongoDB...');
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const { MongoMemoryServer } = require('mongodb-memory-server');
  let mongod;
  try {
    mongod = await MongoMemoryServer.create({
      instance: {
        port: 27017,
        dbPath: DATA_DIR,
        storageEngine: 'wiredTiger',
      },
    });
    console.log('✅ Local persistent MongoDB started on port 27017');
  } catch (err) {
    console.log('ℹ️ MongoDB already running on port 27017 or starting existing instance');
  }

  const uri = 'mongodb://127.0.0.1:27017/bookhive';
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  console.log(`✅ Connected to Mongoose at ${uri}`);

  // 1. Seed/ensure Admin User
  const adminEmail = 'admin@booknexus.com';
  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    const adminHashed = await bcrypt.hash('Admin@123', 10);
    admin = await User.collection.insertOne({
      name: 'System Admin',
      email: adminEmail,
      password: adminHashed,
      role: 'admin',
      usn: 'ADMIN001',
      preferences: { genres: [], authors: [], subjects: [] },
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('👑 Admin user created: admin@booknexus.com (Password: Admin@123)');
  }

  // 2. Seed Students
  if (fs.existsSync(EXPORT_PATH)) {
    const students = JSON.parse(fs.readFileSync(EXPORT_PATH, 'utf8'));
    console.log(`📊 Found ${students.length} students in students_export.json`);

    let insertedCount = 0;
    let updatedCount = 0;

    for (const s of students) {
      const existing = await User.findOne({ email: s.email });
      if (!existing) {
        await User.collection.insertOne({
          name: s.name,
          email: s.email,
          password: s.password,
          role: s.role || 'student',
          usn: s.usn,
          mobile: s.mobile,
          branch: s.branch,
          college: s.college,
          semester: s.semester,
          preferences: s.preferences || { genres: [], authors: [], subjects: [] },
          createdAt: new Date(),
          updatedAt: new Date()
        });
        insertedCount++;
      } else {
        await User.collection.updateOne(
          { email: s.email },
          {
            $set: {
              usn: s.usn,
              mobile: s.mobile,
              branch: s.branch,
              college: s.college,
              semester: s.semester,
              updatedAt: new Date()
            }
          }
        );
        updatedCount++;
      }
    }
    console.log(`✅ Students in DB: ${await User.countDocuments({ role: 'student' })}`);
  }

  // 3. Seed Starter Books if none exist
  const existingBooks = await Book.countDocuments();
  if (existingBooks === 0) {
    console.log('📚 Seeding starter books catalogue...');
    const starterBooks = [
      {
        title: 'Introduction to Algorithms (4th Edition)',
        author: 'Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein',
        genre: 'Computer Science',
        subject: 'Algorithms & Data Structures',
        description: 'Comprehensive and rigorous reference for algorithms and data structures.',
        condition: 'good',
        listingType: 'library',
        availability: 'available',
        rentalPricePerWeek: 0,
      },
      {
        title: 'Database System Concepts (7th Edition)',
        author: 'Abraham Silberschatz, Henry F. Korth, S. Sudarshan',
        genre: 'Computer Science',
        subject: 'Database Management Systems',
        description: 'Foundational concepts of database management, SQL, and query optimization.',
        condition: 'new',
        listingType: 'library',
        availability: 'available',
        rentalPricePerWeek: 0,
      },
      {
        title: 'Artificial Intelligence: A Modern Approach',
        author: 'Stuart Russell, Peter Norvig',
        genre: 'Artificial Intelligence',
        subject: 'Machine Learning & AI',
        description: 'The definitive textbook on artificial intelligence theory and practice.',
        condition: 'new',
        listingType: 'library',
        availability: 'available',
        rentalPricePerWeek: 0,
      },
      {
        title: 'Operating System Concepts',
        author: 'Abraham Silberschatz, Peter B. Galvin, Greg Gagne',
        genre: 'Computer Science',
        subject: 'Operating Systems',
        description: 'Clear explanations of modern operating systems, virtualization, and concurrency.',
        condition: 'good',
        listingType: 'library',
        availability: 'available',
        rentalPricePerWeek: 0,
      },
      {
        title: 'Computer Networks (5th Edition)',
        author: 'Andrew S. Tanenbaum, David J. Wetherall',
        genre: 'Computer Science',
        subject: 'Networking',
        description: 'Classic text on modern computer networking architectures and protocols.',
        condition: 'good',
        listingType: 'library',
        availability: 'available',
        rentalPricePerWeek: 0,
      },
      {
        title: 'Business Analysis and Valuation',
        author: 'Krishna G. Palepu, Paul M. Healy',
        genre: 'Business Systems',
        subject: 'Business Analytics',
        description: 'Using financial statements for business analysis and decision making.',
        condition: 'new',
        listingType: 'library',
        availability: 'available',
        rentalPricePerWeek: 0,
      }
    ];

    await Book.insertMany(starterBooks);
    console.log(`✅ Seeded ${starterBooks.length} starter books.`);
  } else {
    console.log(`📚 Books already present: ${existingBooks}`);
  }

  const totalUsers = await User.countDocuments();
  const totalBooks = await Book.countDocuments();
  console.log('\n─────────────────────────────────────────');
  console.log('          SYSTEM STATUS READY');
  console.log('─────────────────────────────────────────');
  console.log(`  Total Users in DB : ${totalUsers}`);
  console.log(`  Total Books in DB : ${totalBooks}`);
  console.log('─────────────────────────────────────────');

  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
}

seed().catch(err => {
  console.error('❌ Seeding error:', err);
  process.exit(1);
});
