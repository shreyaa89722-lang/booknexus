/**
 * Seed / refresh the approved college student roster (`collegestudents`).
 *
 * The roster is the list of students the college has officially registered.
 * Only a Google account whose verified email is on this list may sign in to
 * BookNexus.
 *
 * Sources, in order of preference:
 *   1. an .xlsx / .csv path passed as the first argument (the college export)
 *   2. backend/students_export.json (the JSON export already in the repo)
 *
 * Behaviour:
 *   - pure upsert by email: existing rows are updated, new rows inserted
 *   - NEVER deletes or deactivates anything
 *   - NEVER touches the `users` collection
 *   - re-runnable (idempotent)
 *
 * Usage:
 *   node backend/scripts/seedCollegeRoster.js
 *   node backend/scripts/seedCollegeRoster.js "C:\path\to\students.xlsx"
 */

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const CollegeStudent = require("../models/collegeStudent");
const { normalizeUsn, normalizeDob } = require("../utils/authIdentityUtils");

const DEFAULT_JSON = path.join(__dirname, "..", "students_export.json");

function pick(row, keys) {
    for (const key of keys) {
        if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== "") {
            return String(row[key]).trim();
        }
    }
    return "";
}

function readSpreadsheet(file) {
    const xlsx = require("xlsx");
    const workbook = xlsx.readFile(file);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return xlsx.utils.sheet_to_json(sheet);
}

function readJson(file) {
    return JSON.parse(fs.readFileSync(file, "utf8"));
}

function toRosterRow(row) {
    const email = pick(row, ["email", "EmailID", "Email", "EMAIL", "emailId"]).toLowerCase();
    const name = pick(row, ["name", "Name", "NAME", "studentName"]);
    const usn = normalizeUsn(pick(row, ["usn", "USN", "Usn", "rollNo"])) || "";
    const rawDob = pick(row, ["dob", "DOB", "DateOfBirth", "Date of Birth"]);
    return {
        email,
        name,
        usn,
        dob: rawDob ? normalizeDob(rawDob) || "" : "",
        mobile: pick(row, ["mobile", "Mobile", "Phone", "phone"]),
        branch: pick(row, ["branch", "Branch", "Department", "department"]),
        college: pick(row, ["college", "College"]),
        semester: pick(row, ["semester", "Semester"]),
    };
}

async function seedCollegeRoster({ file, verbose = true } = {}) {
    const source = file || DEFAULT_JSON;
    if (!fs.existsSync(source)) {
        throw new Error(`College records file not found: ${source}`);
    }

    const rows = /\.(xlsx|xlsm|csv)$/i.test(source) ? readSpreadsheet(source) : readJson(source);
    const log = (...a) => verbose && console.log(...a);
    log(`Reading college records from ${source} (${rows.length} rows)`);

    let inserted = 0;
    let updated = 0;
    const skipped = [];
    const suspicious = [];
    const seenEmails = new Set();
    const seenUsns = new Set();

    for (const raw of rows) {
        const row = toRosterRow(raw);

        if (!row.email || !row.email.includes("@")) {
            skipped.push({ reason: "missing or malformed email", row: raw });
            continue;
        }
        if (!row.usn) {
            skipped.push({ reason: "missing USN", email: row.email });
            continue;
        }
        if (seenEmails.has(row.email)) {
            skipped.push({ reason: "duplicate email in source file", email: row.email });
            continue;
        }
        if (seenUsns.has(row.usn)) {
            skipped.push({ reason: "duplicate USN in source file", email: row.email, usn: row.usn });
            continue;
        }
        // Flag addresses that cannot receive Google sign-in (obvious typos) but
        // keep them on the roster: the college record is authoritative.
        if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(row.email) || /\.(ocm|con|cmo)$/i.test(row.email)) {
            suspicious.push(row.email);
        }
        seenEmails.add(row.email);
        seenUsns.add(row.usn);

        // A USN already held by a DIFFERENT email in the roster must never be
        // silently reassigned — that would let another account inherit it.
        const usnHolder = await CollegeStudent.findOne({ usn: row.usn });
        if (usnHolder && usnHolder.email !== row.email) {
            skipped.push({
                reason: `USN already on the roster under a different email (${usnHolder.email})`,
                email: row.email,
                usn: row.usn,
            });
            continue;
        }

        const existing = await CollegeStudent.findOne({ email: row.email });
        const update = {
            name: row.name || (existing && existing.name) || row.usn,
            usn: row.usn,
            mobile: row.mobile || (existing && existing.mobile) || "",
            branch: row.branch || (existing && existing.branch) || "",
            college: row.college || (existing && existing.college) || "",
            semester: row.semester || (existing && existing.semester) || "",
            source: path.basename(source),
        };
        // Only ever fill a DOB in, never blank out one already on record.
        if (row.dob) update.dob = row.dob;

        if (existing) {
            await CollegeStudent.updateOne({ _id: existing._id }, { $set: update });
            updated++;
        } else {
            await CollegeStudent.create({ email: row.email, active: true, ...update });
            inserted++;
        }
    }

    const total = await CollegeStudent.countDocuments({});
    const activeTotal = await CollegeStudent.countDocuments({ active: true });

    log("--- College roster seed summary ---");
    log(`  inserted: ${inserted}`);
    log(`  updated:  ${updated}`);
    log(`  skipped:  ${skipped.length}`);
    skipped.forEach((s) => log(`    - ${s.email || "(no email)"}: ${s.reason}`));
    if (suspicious.length) {
        log(`  ⚠ ${suspicious.length} address(es) look mistyped and will not be able to sign in with Google:`);
        suspicious.forEach((e) => log(`    - ${e}`));
    }
    log(`  roster total: ${total} (${activeTotal} active)`);

    return { inserted, updated, skipped, suspicious, total, activeTotal };
}

async function main() {
    const uri = process.env.ATLAS_MONGO_URI || process.env.MONGO_URI;
    if (!uri) {
        console.error("No ATLAS_MONGO_URI / MONGO_URI configured in backend/.env");
        process.exit(1);
    }
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    console.log(`Connected to MongoDB (${mongoose.connection.name})`);
    try {
        await seedCollegeRoster({ file: process.argv[2] });
    } finally {
        await mongoose.disconnect();
    }
}

if (require.main === module) {
    main().catch((err) => {
        console.error("College roster seed failed:", err.message);
        process.exit(1);
    });
}

module.exports = { seedCollegeRoster };
