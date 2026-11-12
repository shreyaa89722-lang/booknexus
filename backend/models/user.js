const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        password: { type: String, required: function () { return !this.googleId; }, minlength: 6, select: false },
        role: {
            type: String,
            enum: ["student", "owner", "admin", "librarian"],
            default: "student",
        },
        adminId: { type: String, trim: true, uppercase: true },
        librarianId: { type: String, trim: true, uppercase: true },
        googleId: { type: String, unique: true, sparse: true },
        preferences: {
            genres: [{ type: String }],
            authors: [{ type: String }],
            subjects: [{ type: String }],
        },
        emailPreferences: {
            rentalUpdates: { type: Boolean, default: true },
            dueReminders: { type: Boolean, default: true },
            announcements: { type: Boolean, default: true },
            readingUpdates: { type: Boolean, default: true },
            promotional: { type: Boolean, default: false },
        },
        usn: { type: String, trim: true, uppercase: true },
        dob: { type: String, trim: true },
        preferredName: { type: String, trim: true },
        bio: { type: String, trim: true },
        mobile: { type: String, trim: true },
        branch: { type: String, trim: true },
        college: { type: String, trim: true },
        semester: { type: String, trim: true },
        registrationCompleted: { type: Boolean, default: false },
        quizCompleted: { type: Boolean, default: false },
        quizAnswers: { type: mongoose.Schema.Types.Mixed, default: null },
        onboardingStep: {
            type: String,
            enum: ["details", "quiz", "completed"],
            default: "details",
        },
        resetPasswordOtpHash: { type: String, select: false },
        resetPasswordOtpExpires: { type: Date, select: false },
        resetPasswordOtpAttempts: { type: Number, default: 0, select: false },
        resetPasswordLastRequested: { type: Date, select: false },
        passwordResetTokenHash: { type: String, select: false },
        passwordResetTokenExpires: { type: Date, select: false },
    },
    { timestamps: true }
);

const { normalizeUsn, normalizeDob, sanitizeDisplayName } = require("../utils/authIdentityUtils");

// Indexes
userSchema.index({ usn: 1 }, { unique: true, sparse: true });

// Pre-save hooks: clean empty usn strings to undefined so sparse index works
userSchema.pre("save", async function (next) {
    if (this.usn === "" || this.usn === null) {
        this.usn = undefined;
    }
    if (this.usn) {
        this.usn = normalizeUsn(this.usn);
    }
    if (this.name) {
        this.name = sanitizeDisplayName(this.name);
    }
    if (this.dob && this.isModified("dob")) {
        const norm = normalizeDob(this.dob);
        if (norm) {
            this.dob = norm;
        }
    }
    if (!this.password || !this.isModified("password")) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Helper method to check a login password against the stored hash
userSchema.methods.comparePassword = async function (candidatePassword) {
    if (!this.password || !candidatePassword) return false;
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
