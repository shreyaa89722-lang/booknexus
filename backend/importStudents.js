const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const excelPath = 'C:\\Users\\user\\Downloads\\Sixth Semester students - booknexus.xlsx';

async function importStudents() {
  require('dotenv').config({ path: path.join(__dirname, '.env') });
  
  if (!fs.existsSync(excelPath)) {
    console.error(`Excel file not found at: ${excelPath}`);
    process.exit(1);
  }

  console.log(`Reading Excel file: ${excelPath}`);
  const workbook = xlsx.readFile(excelPath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(sheet);

  console.log(`Found ${rows.length} student records in Excel.`);

  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI is missing in .env');
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  console.log('Connected to MongoDB successfully!');

  const User = require('./models/user');

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    const email = row.EmailID ? String(row.EmailID).trim().toLowerCase() : null;
    const name = row.Name ? String(row.Name).trim() : 'Unknown';
    const usn = row.USN ? String(row.USN).trim() : '';
    const mobile = row.Mobile ? String(row.Mobile).trim() : '';
    const branch = row.Branch ? String(row.Branch).trim() : '';
    const college = row.College ? String(row.College).trim() : '';
    const semester = row.Semester ? String(row.Semester).trim() : 'Sixth';

    if (!email) {
      console.warn(`Skipping row without email: ${JSON.stringify(row)}`);
      skipped++;
      continue;
    }

    const defaultPassword = usn || 'Student@123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      existingUser.name = name;
      existingUser.role = 'student';
      if (!existingUser.preferences) existingUser.preferences = {};
      if (branch) existingUser.preferences.subjects = [branch];
      await existingUser.save();
      updated++;
    } else {
      await User.create({
        name,
        email,
        password: hashedPassword,
        role: 'student',
        preferences: {
          genres: [],
          authors: [],
          subjects: branch ? [branch] : []
        }
      });
      inserted++;
    }
  }

  console.log(`Import summary:`);
  console.log(`- Inserted: ${inserted}`);
  console.log(`- Updated: ${updated}`);
  console.log(`- Skipped: ${skipped}`);
  console.log(`- Total processed: ${rows.length}`);

  await mongoose.disconnect();
  console.log('MongoDB connection closed.');
}

importStudents().catch(err => {
  console.error('Import failed with error:', err.message);
  process.exit(1);
});
