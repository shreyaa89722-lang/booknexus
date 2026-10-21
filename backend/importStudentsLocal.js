/**
 * importStudentsLocal.js
 * Uses mongodb-memory-server to spin up an embedded MongoDB instance,
 * imports all students from the Excel file, then exports a JSON backup.
 * The JSON backup can be loaded into any real MongoDB (Atlas or local) later.
 */

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const EXCEL_PATH = 'C:\\Users\\user\\Downloads\\Sixth Semester students - booknexus.xlsx';
const OUTPUT_JSON = path.join(__dirname, 'students_export.json');

// ── Inline Student schema (mirrors User model + extra fields) ─────────────────
const studentSchema = new mongoose.Schema({
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

async function run() {
  // 1. Start embedded MongoDB
  console.log('🚀 Starting embedded MongoDB...');
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  console.log(`✅ Embedded MongoDB running at: ${uri}`);

  await mongoose.connect(uri);
  const Student = mongoose.model('Student', studentSchema);

  // 2. Read Excel file
  if (!fs.existsSync(EXCEL_PATH)) {
    console.error(`❌ Excel file not found: ${EXCEL_PATH}`);
    process.exit(1);
  }
  const wb = xlsx.readFile(EXCEL_PATH);
  const rows = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
  console.log(`📊 Found ${rows.length} rows in Excel.`);

  // 3. Import rows
  let inserted = 0, skipped = 0, errors = 0;
  const exportedData = [];

  for (const row of rows) {
    const email = row.EmailID ? String(row.EmailID).trim().toLowerCase() : null;
    if (!email) { skipped++; continue; }

    const name     = String(row.Name     || 'Unknown').trim();
    const usn      = String(row.USN      || '').trim();
    const mobile   = String(row.Mobile   || '').trim();
    const branch   = String(row.Branch   || '').trim();
    const college  = String(row.College  || '').trim();
    const semester = String(row.Semester || 'Sixth').trim();

    const defaultPassword = usn || 'Student@123';
    const hashedPassword  = await bcrypt.hash(defaultPassword, 10);

    const doc = {
      name,
      email,
      password: hashedPassword,
      role: 'student',
      usn,
      mobile,
      branch,
      college,
      semester,
      preferences: { genres: [], authors: [], subjects: branch ? [branch] : [] },
    };

    try {
      await Student.create(doc);
      exportedData.push({ ...doc, plainPassword: defaultPassword });
      inserted++;
    } catch (err) {
      if (err.code === 11000) {
        console.warn(`  ⚠  Duplicate email skipped: ${email}`);
        skipped++;
      } else {
        console.error(`  ❌ Error for ${email}: ${err.message}`);
        errors++;
      }
    }
  }

  // 4. Verify in DB
  const count = await Student.countDocuments();
  console.log(`\n📦 Records in embedded MongoDB: ${count}`);

  // 5. Export to JSON
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(exportedData, null, 2), 'utf8');
  console.log(`\n✅ Export complete → ${OUTPUT_JSON}`);

  // 6. Print summary table
  console.log('\n─────────────────────────────────────────');
  console.log('          IMPORT SUMMARY');
  console.log('─────────────────────────────────────────');
  console.log(`  Total rows in Excel : ${rows.length}`);
  console.log(`  Successfully inserted: ${inserted}`);
  console.log(`  Skipped (dup/empty) : ${skipped}`);
  console.log(`  Errors              : ${errors}`);
  console.log('─────────────────────────────────────────');

  // 7. Print first 5 records as preview
  console.log('\n📋 First 5 imported students:');
  const preview = await Student.find().limit(5).select('-password');
  preview.forEach((s, i) => {
    console.log(`  ${i + 1}. ${s.name} | ${s.email} | ${s.usn} | ${s.branch}`);
  });

  await mongoose.disconnect();
  await mongod.stop();
  console.log('\n🏁 Done! Check students_export.json in your backend folder.');
}

run().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
});
