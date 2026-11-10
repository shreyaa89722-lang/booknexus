const mongoose = require("mongoose");

/**
 * BookNexus — Approved College Student Roster
 *
 * This collection is the single source of truth for "who is a real college
 * student". It is deliberately SEPARATE from the `users` collection:
 *
 *  - `users`      = BookNexus accounts (students, librarians, admins, test rows)
 *  - `collegestudents` = the official college student records supplied by the
 *                   institution (Excel / SIS export).
 *
 * A Google account is only allowed to sign in to BookNexus when its verified
 * email address exists here with `active: true`. Nothing in `users` grants
 * access on its own, because `users` also contains staff and legacy test rows.
 *
 * The roster is read-only from the application's point of view; it is populated
 * by `backend/scripts/seedCollegeRoster.js` (idempotent upsert, never deletes).
 */
const collegeStudentSchema = new mongoose.Schema(
    {
        // Verified college email address, stored already normalized
        // (trimmed + lowercased) so lookups are exact and case-insensitive.
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        name: { type: String, required: true, trim: true },
        usn: { type: String, required: true, trim: true, uppercase: true },
        // Date of birth as it appears in college records (ISO yyyy-mm-dd when
        // known). Many institutional exports omit it; when it is absent the
        // student's first registration establishes it instead.
        dob: { type: String, trim: true, default: "" },
        mobile: { type: String, trim: true, default: "" },
        branch: { type: String, trim: true, default: "" },
        college: { type: String, trim: true, default: "" },
        semester: { type: String, trim: true, default: "" },
        // A student who has left / been withdrawn is deactivated rather than
        // deleted, so historical rentals keep their reference.
        active: { type: Boolean, default: true },
        source: { type: String, trim: true, default: "college-records" },
    },
    { timestamps: true, collection: "collegestudents" }
);

// One roster row per USN: this is what stops two different Google accounts
// from ever being able to claim the same USN.
collegeStudentSchema.index({ usn: 1 }, { unique: true });

module.exports =
    mongoose.models.CollegeStudent ||
    mongoose.model("CollegeStudent", collegeStudentSchema);
