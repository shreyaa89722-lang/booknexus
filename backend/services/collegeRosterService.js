const CollegeStudent = require("../models/collegeStudent");
const { normalizeUsn } = require("../utils/authIdentityUtils");

/**
 * Approved college student roster lookups.
 *
 * Every Google sign-in is checked against this roster before BookNexus will
 * create an account, issue a token or build a student profile.
 */

// The single message shown to anyone whose Google account is not in college
// records. It deliberately reveals nothing about who IS on the roster.
const ROSTER_DENIED_MESSAGE =
    "This Google account is not registered in college records. Please use your registered college email or contact the librarian.";

/** Trim + lowercase an email so comparison is whitespace- and case-insensitive. */
function normalizeEmail(email) {
    if (!email) return "";
    return String(email).trim().toLowerCase();
}

function escapeRegex(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Find the approved college record for a verified Google email address.
 * Returns null when the email is not in college records or is deactivated.
 */
async function findApprovedByEmail(email) {
    const clean = normalizeEmail(email);
    if (!clean) return null;

    // Primary lookup: emails are stored normalized, so this is an exact hit.
    let record = await CollegeStudent.findOne({ email: clean, active: true });
    if (record) return record;

    // Safety net for any legacy row that was inserted with mixed case or
    // padding before normalization was enforced by the schema.
    record = await CollegeStudent.findOne({
        email: { $regex: new RegExp(`^\\s*${escapeRegex(clean)}\\s*$`, "i") },
        active: true,
    });
    return record || null;
}

/** Find the approved college record that owns a given USN. */
async function findApprovedByUsn(usn) {
    const clean = normalizeUsn(usn);
    if (!clean) return null;
    return CollegeStudent.findOne({ usn: clean, active: true });
}

/** How many students the roster currently holds (used by diagnostics/tests). */
async function countApproved() {
    return CollegeStudent.countDocuments({ active: true });
}

/**
 * The subset of a student's own college record that is safe to send back to
 * them after their Google email has been cryptographically verified. Never
 * used for anybody other than the signed-in student themselves.
 */
function publicRosterView(record) {
    if (!record) return null;
    return {
        name: record.name || "",
        usn: record.usn || "",
        branch: record.branch || "",
        college: record.college || "",
        semester: record.semester || "",
        hasDobOnRecord: !!record.dob,
    };
}

module.exports = {
    ROSTER_DENIED_MESSAGE,
    normalizeEmail,
    findApprovedByEmail,
    findApprovedByUsn,
    countApproved,
    publicRosterView,
};
