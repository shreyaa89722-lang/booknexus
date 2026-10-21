/**
 * pushToAtlas.js
 * Reads the students_export.json file and pushes all records to your real
 * MongoDB Atlas database. Run this once your Atlas MONGO_URI is working.
 *
 * Usage: node pushToAtlas.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const EXPORT_FILE = path.join(__dirname, 'students_export.json');

const userSchema = new mongoose.Schema({
  name:       { type: String, required: true, trim: true },
  email:      { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:   { type: String, required: true },
  role:       { type: String, default: 'student' },
  usn:        { type: String },
  mobile:     { type: String },
  branch:     { type: String },
  college:    { type: String },
  semester:   { type: String },
  preferences: {
    genres:   [String],
    authors:  [String],
    subjects: [String],
  },
}, { timestamps: true });

async function push() {
  const uri = process.env.ATLAS_MONGO_URI || process.env.MONGO_URI;
  if (!uri) {
    console.error('❌ MONGO_URI not set in .env');
    process.exit(1);
  }

  if (!fs.existsSync(EXPORT_FILE)) {
    console.error(`❌ Export file not found: ${EXPORT_FILE}`);
    console.error('   Run importStudentsLocal.js first.');
    process.exit(1);
  }

  console.log('🔗 Connecting to MongoDB Atlas...');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log('✅ Connected to Atlas!\n');

  const User = mongoose.model('User', userSchema);
  const students = JSON.parse(fs.readFileSync(EXPORT_FILE, 'utf8'));
  console.log(`📊 Loading ${students.length} students from export file...`);

  let inserted = 0, skipped = 0, errors = 0;

  for (const s of students) {
    const { plainPassword, ...doc } = s; // remove plainPassword before saving
    try {
      await User.create(doc);
      inserted++;
    } catch (err) {
      if (err.code === 11000) {
        skipped++;
      } else {
        console.error(`  ❌ ${s.email}: ${err.message}`);
        errors++;
      }
    }
  }

  const total = await User.countDocuments({ role: 'student' });

  console.log('\n─────────────────────────────────────────');
  console.log('          ATLAS PUSH SUMMARY');
  console.log('─────────────────────────────────────────');
  console.log(`  Inserted  : ${inserted}`);
  console.log(`  Skipped   : ${skipped} (already exist)`);
  console.log(`  Errors    : ${errors}`);
  console.log(`  Total in DB: ${total} students`);
  console.log('─────────────────────────────────────────');

  await mongoose.disconnect();
  console.log('\n✅ All done!');
}

push().catch(err => {
  console.error('❌ Fatal:', err.message);
  process.exit(1);
});
