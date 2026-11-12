const asyncHandler = require("express-async-handler");
const User = require("../models/user");
const generateToken = require("../utils/generateToken");
const { sendSignInNotification } = require("../services/emailService");
const { evaluateQuizSubmission } = require("../services/quizService");
const {
    normalizeNameForComparison,
    compareNames,
    sanitizeDisplayName,
    normalizeUsn,
    normalizeDob,
    compareDobs,
} = require("../utils/authIdentityUtils");

// @desc   Register a new user
// @route  POST /api/auth/register
const registerUser = asyncHandler(async (req, res) => {
    const {
        name,
        email,
        password,
        confirmPassword,
        role,
        usn,
        dob,
        mobile,
        branch,
        department,
        college,
        semester,
        preferredName,
        bio,
        quizAnswers,
    } = req.body;

    if (!email || !password) {
        res.status(400);
        throw new Error("Email and password are required");
    }

    if (confirmPassword && confirmPassword !== password) {
        res.status(400);
        throw new Error("Password and confirm password do not match");
    }

    if (password.length < 6) {
        res.status(400);
        throw new Error("Password must be at least 6 characters long");
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanUsn = normalizeUsn(usn);
    const normDob = dob ? normalizeDob(dob) : undefined;
    if (dob && !normDob) {
        res.status(400);
        throw new Error("Please enter a valid date of birth (valid calendar date, cannot be in the future).");
    }

    const cleanBranch = (branch || department || "").trim();
    const cleanCollege = (college || "Malnad college of engineering").trim();
    const cleanSemester = (semester || "Sixth").trim();
    const safeDisplayName = sanitizeDisplayName(name) || (cleanUsn || cleanEmail.split("@")[0]);

    // 1. Check email uniqueness
    const existingEmail = await User.findOne({ email: cleanEmail });
    if (existingEmail) {
        res.status(400);
        throw new Error("An account with this email address already exists. Please sign in instead.");
    }

    // 2. Check USN uniqueness & DOB identity verification if provided
    if (cleanUsn) {
        const existingUsn = await User.findOne({ usn: cleanUsn });
        if (existingUsn) {
            // Secure DOB verification without leaking another student's private DOB
            if (existingUsn.dob && normDob && !compareDobs(existingUsn.dob, normDob)) {
                res.status(403);
                throw new Error(`USN '${cleanUsn}' is already registered. The date of birth provided does not match our records.`);
            }
            res.status(400);
            throw new Error(`USN '${cleanUsn}' is already registered with an existing student account. Please sign in.`);
        }
    }

    // Check against authorized college roster if student is in roster
    let rosterRecord = null;
    try {
        const { findApprovedByEmail } = require("../services/collegeRosterService");
        rosterRecord = await findApprovedByEmail(cleanEmail);
        if (rosterRecord) {
            if (name && !compareNames(name, rosterRecord.name)) {
                res.status(400);
                throw new Error("This name does not match your college student record. Please enter your full name as the college has it.");
            }
            if (cleanUsn && rosterRecord.usn && cleanUsn !== normalizeUsn(rosterRecord.usn)) {
                res.status(400);
                throw new Error("This USN does not match the USN held for you in college records.");
            }
            if (normDob && rosterRecord.dob && !compareDobs(rosterRecord.dob, normDob)) {
                res.status(400);
                throw new Error("This date of birth does not match the one on record for your USN.");
            }
        }
    } catch (rErr) {
        if (rErr.status || res.statusCode >= 400) throw rErr;
    }

    // 3. Evaluate quiz submission if provided
    let genrePreferences = [];
    let isQuizDone = false;
    if (quizAnswers) {
        const quizEval = evaluateQuizSubmission(quizAnswers);
        if (!quizEval.valid) {
            res.status(400);
            throw new Error(quizEval.error || "Please complete all 6 questions in the student quiz");
        }
        genrePreferences = quizEval.genres;
        isQuizDone = true;
    }

    if (role && (role === "admin" || role === "librarian")) {
        res.status(403);
        throw new Error("Direct registration for administrative roles is not permitted. Please contact the system administrator.");
    }

    const allowedRole = "student";

    // 4. Create new student user with race-condition handling
    let user;
    try {
        user = await User.create({
            name: safeDisplayName,
            email: cleanEmail,
            password,
            role: allowedRole,
            usn: cleanUsn || (rosterRecord?.usn || undefined),
            dob: normDob || (rosterRecord?.dob || undefined),
            mobile: mobile ? String(mobile).trim() : (rosterRecord?.mobile || undefined),
            branch: cleanBranch || (rosterRecord?.branch || undefined),
            college: cleanCollege || (rosterRecord?.college || "Malnad college of engineering"),
            semester: cleanSemester || (rosterRecord?.semester || "Sixth"),
            preferredName: preferredName ? sanitizeDisplayName(preferredName) : (safeDisplayName.split(" ")[0] || "Reader"),
            bio: bio ? String(bio).trim().slice(0, 300) : "",
            registrationCompleted: true,
            quizCompleted: isQuizDone,
            quizAnswers: quizAnswers || null,
            onboardingStep: "completed",
            preferences: {
                genres: genrePreferences,
                authors: [],
                subjects: cleanBranch ? [cleanBranch] : (rosterRecord?.branch ? [rosterRecord.branch] : []),
            },
        });
    } catch (createErr) {
        if (createErr.code === 11000) {
            if (createErr.keyPattern && createErr.keyPattern.usn) {
                res.status(409);
                throw new Error(`USN '${cleanUsn}' was just registered by another request. Please sign in.`);
            }
            if (createErr.keyPattern && createErr.keyPattern.email) {
                res.status(409);
                throw new Error("An account with this email address was just registered. Please sign in.");
            }
        }
        throw createErr;
    }

    // 5. Trigger welcome email asynchronously
    try {
        const emailEventService = require("../services/emailEventService");
        emailEventService.onUserRegistered(user).catch((e) => console.warn("Welcome email note:", e.message));
    } catch (error) {
        console.error("Welcome email failed:", error.message);
    }

    res.status(201).json({
        success: true,
        data: {
            _id: user._id,
            name: user.name,
            email: user.email,
            usn: user.usn,
            dob: user.dob || "",
            role: user.role,
            branch: user.branch,
            college: user.college,
            semester: user.semester,
            registrationCompleted: user.registrationCompleted,
            quizCompleted: user.quizCompleted,
            preferredName: user.preferredName,
            bio: user.bio,
            preferences: user.preferences,
            emailPreferences: user.emailPreferences,
            token: generateToken(user._id),
        },
    });
});

// @desc   Login a user (Supports USN or Email)
// @route  POST /api/auth/login
const loginUser = asyncHandler(async (req, res) => {
    const rawIdentifier = (req.body.identifier || req.body.usn || req.body.email || "").trim();
    const { password } = req.body;

    if (!rawIdentifier || !password) {
        res.status(400);
        throw new Error("USN/Email and password are required");
    }

    const cleanIdentifier = rawIdentifier.toUpperCase();
    const lowerIdentifier = rawIdentifier.toLowerCase();

    // Query by normalized USN or Email
    const user = await User.findOne({
        $or: [
            { email: lowerIdentifier },
            { usn: cleanIdentifier },
            { usn: { $regex: new RegExp(`^${rawIdentifier}$`, "i") } },
        ],
    }).select("+password");

    if (!user || !(await user.comparePassword(password))) {
        res.status(401);
        throw new Error("Invalid USN/email or password");
    }

    // Check incomplete onboarding status
    if (user.registrationCompleted === false) {
        return res.json({
            success: true,
            needsOnboarding: true,
            message: "Student registration is incomplete. Please complete your profile and quiz.",
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                usn: user.usn,
                dob: user.dob || "",
                role: user.role,
                onboardingStep: user.onboardingStep || "details",
                token: generateToken(user._id),
            },
        });
    }

    // Trigger sign-in alert email
    try {
        const emailEventService = require("../services/emailEventService");
        emailEventService.onUserLogin(user, {
            time: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "full", timeStyle: "medium" }),
            device: req.headers["user-agent"] || "Web Browser",
            ip: req.ip || "127.0.0.1",
        }).catch((e) => console.warn("Sign-in notification warning:", e.message));
    } catch (notifyErr) { }

    res.json({
        success: true,
        data: {
            _id: user._id,
            name: user.name,
            email: user.email,
            usn: user.usn,
            dob: user.dob || "",
            role: user.role,
            branch: user.branch,
            college: user.college,
            semester: user.semester,
            registrationCompleted: user.registrationCompleted,
            quizCompleted: user.quizCompleted,
            preferredName: user.preferredName,
            bio: user.bio,
            preferences: user.preferences,
            emailPreferences: user.emailPreferences,
            token: generateToken(user._id),
        },
    });
});

// @desc   Complete student onboarding & genre quiz (for Google users or incomplete accounts)
// @route  POST /api/auth/complete-onboarding
const completeOnboarding = asyncHandler(async (req, res) => {
    const { name, usn, dob, password, confirmPassword, mobile, branch, department, college, semester, preferredName, bio, quizAnswers } = req.body;

    if (!usn || !String(usn).trim()) {
        res.status(400);
        throw new Error("USN is required to complete student registration");
    }

    const cleanUsn = normalizeUsn(usn);
    if (!cleanUsn) {
        res.status(400);
        throw new Error("A valid USN is required to complete student registration");
    }

    const normDob = dob ? normalizeDob(dob) : null;
    if (!normDob) {
        res.status(400);
        throw new Error("A valid date of birth is required to verify and protect your USN.");
    }

    if (password && confirmPassword && password !== confirmPassword) {
        res.status(400);
        throw new Error("Password and confirm password do not match");
    }

    // Determine target user from protect middleware or token/email/googleId in body
    let user = req.user;
    if (!user && req.body.email) {
        user = await User.findOne({ email: req.body.email.toLowerCase().trim() });
    } else if (!user && req.body.googleId) {
        user = await User.findOne({ googleId: req.body.googleId });
    }

    // Check if USN is already claimed by an existing account
    const existingUsnUser = await User.findOne({ usn: cleanUsn });
    if (existingUsnUser && (!user || existingUsnUser._id.toString() !== user._id.toString())) {
        // A different account is attempting to claim this USN!
        // Requirement 3: If a student attempts to claim an already-registered USN,
        // compare the submitted DOB against the existing record through a secure verification process.
        // If DOB does not match, reject the claim.
        // Do not reveal another student's private DOB in error messages or API responses.
        // Do not allow a new Google account to bypass existing USN ownership.

        if (!existingUsnUser.dob) {
            // Legacy record without DOB: cannot claim without existing account authentication
            res.status(403);
            throw new Error(`USN '${cleanUsn}' is already registered to another account. Please sign in to your existing account.`);
        }

        const existingDobNorm = normalizeDob(existingUsnUser.dob);
        if (!compareDobs(existingDobNorm, normDob)) {
            res.status(403);
            throw new Error(`USN '${cleanUsn}' is already registered. The date of birth provided does not match our records.`);
        }

        // DOB MATCHES! The student has proven ownership of the USN via verified DOB.
        // Link the Google account to the existing student record
        if (user && user._id.toString() !== existingUsnUser._id.toString()) {
            if (user.googleId && !existingUsnUser.googleId) {
                existingUsnUser.googleId = user.googleId;
            }
            // Remove the temporary incomplete user document so no duplicate exists
            if (!user.registrationCompleted) {
                await User.deleteOne({ _id: user._id }).catch(() => { });
            }
            user = existingUsnUser;
        } else {
            user = existingUsnUser;
        }
    }

    if (!user) {
        const email = (req.body.email || "").toLowerCase().trim();
        if (!email) {
            res.status(401);
            throw new Error("User account not found or not authenticated");
        }
        const userPassword = (password && typeof password === "string" && password.trim().length >= 6)
            ? password.trim()
            : (Math.random().toString(36).slice(-10) + "A1!Aa");

        user = await User.create({
            name: sanitizeDisplayName(req.body.name) || (cleanUsn || email.split("@")[0]),
            email: email,
            password: userPassword,
            googleId: req.body.googleId || null,
            role: "student",
            registrationCompleted: false,
            quizCompleted: false,
            onboardingStep: "details",
            preferences: { genres: [], authors: [], subjects: [] },
        });
    }

    // Evaluate required quiz
    if (!quizAnswers) {
        res.status(400);
        throw new Error("Please complete the required student genre quiz to finish onboarding");
    }

    const quizEval = evaluateQuizSubmission(quizAnswers);
    if (!quizEval.valid) {
        res.status(400);
        throw new Error(quizEval.error || "Please answer all 6 questions in the student quiz");
    }

    const cleanBranch = (branch || department || user.branch || "").trim();
    const cleanCollege = (college || user.college || "Malnad college of engineering").trim();
    const cleanSemester = (semester || user.semester || "Sixth").trim();

    // Update profile
    if (name && name.trim() && name.trim().length >= 2) {
        user.name = sanitizeDisplayName(name);
    }
    user.usn = cleanUsn;

    // Critical Requirement 3: Never overwrite an existing verified DOB during subsequent login or profile updates.
    if (!user.dob && normDob) {
        user.dob = normDob;
    }

    // Separate BookNexus password creation
    if (password && typeof password === "string" && password.trim().length >= 6) {
        user.password = password.trim();
    }
    if (preferredName) user.preferredName = String(preferredName).trim();
    if (bio) user.bio = String(bio).trim();
    if (mobile) user.mobile = String(mobile).trim();
    if (cleanBranch) user.branch = cleanBranch;
    user.college = cleanCollege;
    user.semester = cleanSemester;
    user.quizAnswers = quizAnswers;
    user.quizCompleted = true;
    user.preferences = {
        genres: quizEval.genres,
        authors: user.preferences?.authors || [],
        subjects: cleanBranch ? [cleanBranch] : (user.preferences?.subjects || []),
    };
    user.registrationCompleted = true;
    user.onboardingStep = "completed";

    // Handle simultaneous duplicate USN registration gracefully
    try {
        await user.save();
    } catch (saveErr) {
        if (saveErr.code === 11000) {
            res.status(409);
            throw new Error(`USN '${cleanUsn}' was just claimed by another registration request. Please sign in.`);
        }
        throw saveErr;
    }

    // Dispatch welcome email
    try {
        const emailEventService = require("../services/emailEventService");
        emailEventService.onUserRegistered(user).catch(() => { });
    } catch (e) { }

    res.json({
        success: true,
        message: "Student onboarding completed successfully! Welcome to BookNexus.",
        data: {
            _id: user._id,
            name: user.name,
            email: user.email,
            usn: user.usn,
            dob: user.dob || "",
            role: user.role,
            branch: user.branch,
            college: user.college,
            semester: user.semester,
            registrationCompleted: user.registrationCompleted,
            quizCompleted: user.quizCompleted,
            preferredName: user.preferredName,
            bio: user.bio,
            preferences: user.preferences,
            token: generateToken(user._id),
        },
    });
});

// @desc   Get current logged-in user's profile
// @route  GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
    res.json({ success: true, data: req.user });
});

// @desc   Update user general preferences
// @route  PUT /api/auth/preferences
const updatePreferences = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (!user) {
        res.status(404);
        throw new Error("User not found");
    }
    user.preferences = req.body.preferences || user.preferences;
    await user.save();
    res.json({ success: true, data: user.preferences });
});

// @desc   Get user email notification preferences
// @route  GET /api/auth/email-preferences
const getEmailPreferences = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (!user) {
        res.status(404);
        throw new Error("User not found");
    }
    res.json({
        success: true,
        data: user.emailPreferences || {
            rentalUpdates: true,
            dueReminders: true,
            announcements: true,
            readingUpdates: true,
            promotional: false,
        },
        nonDisableable: [
            { category: "security", label: "Security & Account Access Alerts", explanation: "Mandatory security notices for sign-ins, profile updates, and unverified access." },
            { category: "transactional", label: "Payment & Fine Receipts", explanation: "Legally required audit receipts for university financial records." },
        ],
    });
});

// @desc   Update user email notification preferences
// @route  PUT /api/auth/email-preferences
const updateEmailPreferences = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (!user) {
        res.status(404);
        throw new Error("User not found");
    }
    const { rentalUpdates, dueReminders, announcements, readingUpdates, promotional } = req.body || {};

    user.emailPreferences = {
        rentalUpdates: typeof rentalUpdates === "boolean" ? rentalUpdates : (user.emailPreferences?.rentalUpdates ?? true),
        dueReminders: typeof dueReminders === "boolean" ? dueReminders : (user.emailPreferences?.dueReminders ?? true),
        announcements: typeof announcements === "boolean" ? announcements : (user.emailPreferences?.announcements ?? true),
        readingUpdates: typeof readingUpdates === "boolean" ? readingUpdates : (user.emailPreferences?.readingUpdates ?? true),
        promotional: typeof promotional === "boolean" ? promotional : (user.emailPreferences?.promotional ?? false),
    };

    await user.save();

    try {
        const emailEventService = require("../services/emailEventService");
        emailEventService.onProfileUpdated(user, {
            changeSummary: "Email notification preferences updated",
        }).catch(() => { });
    } catch (e) { }

    res.json({
        success: true,
        message: "Email notification preferences updated successfully",
        data: user.emailPreferences,
    });
});

// @desc   Logout user / invalidate session
// @route  POST /api/auth/logout
const logoutUser = asyncHandler(async (req, res) => {
    try {
        let userToNotify = req.user;
        if (!userToNotify && req.body && (req.body.email || req.body.userId)) {
            userToNotify = await User.findOne({
                $or: [
                    ...(req.body.email ? [{ email: req.body.email.toLowerCase().trim() }] : []),
                    ...(req.body.userId ? [{ _id: req.body.userId }] : []),
                ],
            });
        }
        if (userToNotify) {
            const emailEventService = require("../services/emailEventService");
            emailEventService.onUserLogout(userToNotify, {
                time: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "full", timeStyle: "medium" }),
                device: req.headers["user-agent"] || "Web Browser",
                ip: req.ip || "127.0.0.1",
            }).catch((e) => console.warn("Logout notification warning:", e.message));
        }
    } catch (e) { }

    res.json({ success: true, message: "Logged out successfully" });
});

// @desc   Verify whether an email is eligible for a specific role (student, admin, librarian)
// @route  POST /api/auth/verify-role-eligibility
const verifyRoleEligibility = asyncHandler(async (req, res) => {
    const { email, role } = req.body;
    if (!email || !role) {
        res.status(400);
        throw new Error("Email and role are required");
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanRole = String(role).trim().toLowerCase();

    if (!["student", "admin", "librarian"].includes(cleanRole)) {
        res.status(400);
        throw new Error("Invalid role specified");
    }

    if (cleanRole === "admin") {
        const adminUser = await User.findOne({ email: cleanEmail, role: "admin" });
        if (!adminUser) {
            return res.status(403).json({
                success: false,
                eligible: false,
                message: "You are not authorised to access this role. Please sign in using your registered account."
            });
        }
        return res.json({
            success: true,
            eligible: true,
            role: "admin",
            message: "Admin email verified. Please provide Admin credentials."
        });
    }

    if (cleanRole === "librarian") {
        const librarianUser = await User.findOne({ email: cleanEmail, role: "librarian" });
        if (!librarianUser) {
            return res.status(403).json({
                success: false,
                eligible: false,
                message: "You are not authorised to access this role. Please sign in using your registered account."
            });
        }
        return res.json({
            success: true,
            eligible: true,
            role: "librarian",
            message: "Librarian email verified. Please provide Librarian credentials."
        });
    }

    // Role: student
    const studentUser = await User.findOne({ email: cleanEmail });
    if (studentUser && studentUser.role !== "student") {
        return res.status(403).json({
            success: false,
            eligible: false,
            message: "This email is registered under an administrative role. Please use the appropriate role login."
        });
    }

    return res.json({
        success: true,
        eligible: true,
        role: "student",
        isRegistered: !!studentUser,
        student: studentUser ? {
            usn: studentUser.usn,
            name: studentUser.name,
            registrationCompleted: studentUser.registrationCompleted
        } : null
    });
});

// @desc   Three-factor role login (Email identity + Role + ID/USN + Password)
// @route  POST /api/auth/role-login
const roleLogin = asyncHandler(async (req, res) => {
    const { email, identifier, password, role } = req.body;

    if (!email || !identifier || !password || !role) {
        res.status(400);
        throw new Error("Email, ID/USN, password, and role are required");
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanRole = String(role).trim().toLowerCase();
    const cleanId = String(identifier).trim().toUpperCase();

    if (!["student", "admin", "librarian"].includes(cleanRole)) {
        res.status(400);
        throw new Error("Invalid role specified");
    }

    // 1. Find user by email and specified role
    const user = await User.findOne({ email: cleanEmail, role: cleanRole }).select("+password");
    if (!user) {
        if (cleanRole === "admin" || cleanRole === "librarian") {
            return res.status(403).json({
                success: false,
                message: "You are not authorised to access this role. Please sign in using your registered account."
            });
        }
        return res.status(401).json({
            success: false,
            message: "Invalid student credentials or email mismatch."
        });
    }

    // 2. Validate identifier matches role-specific ID
    let idMatches = false;
    if (cleanRole === "admin") {
        idMatches = (user.adminId && user.adminId.toUpperCase() === cleanId) ||
            (user.usn && user.usn.toUpperCase() === cleanId);
    } else if (cleanRole === "librarian") {
        idMatches = (user.librarianId && user.librarianId.toUpperCase() === cleanId) ||
            (user.usn && user.usn.toUpperCase() === cleanId);
    } else if (cleanRole === "student") {
        idMatches = (user.usn && user.usn.toUpperCase() === cleanId);
    }

    if (!idMatches) {
        res.status(401);
        throw new Error(`Invalid ${cleanRole === "admin" ? "Admin ID" : cleanRole === "librarian" ? "Librarian ID" : "USN"} for this registered email`);
    }

    // 3. Compare password
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
        res.status(401);
        throw new Error("Invalid password");
    }

    // 4. Trigger sign-in alert email
    try {
        const emailEventService = require("../services/emailEventService");
        emailEventService.onUserLogin(user, {
            time: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "full", timeStyle: "medium" }),
            device: req.headers["user-agent"] || "Web Browser",
            ip: req.ip || "127.0.0.1",
        }).catch((e) => console.warn("Sign-in notification warning:", e.message));
    } catch (notifyErr) { }

    const token = generateToken(user._id, user.role);

    res.json({
        success: true,
        data: {
            _id: user._id,
            name: user.name,
            email: user.email,
            usn: user.usn,
            adminId: user.adminId,
            librarianId: user.librarianId,
            role: user.role,
            branch: user.branch,
            college: user.college,
            semester: user.semester,
            registrationCompleted: user.registrationCompleted,
            quizCompleted: user.quizCompleted,
            token,
        },
    });
});

// @desc   Step 1 — Student Registration (Full Name, USN, DOB, Password)
// @route  POST /api/auth/register-step1
const registerStep1 = asyncHandler(async (req, res) => {
    const { name, email, usn, dob, password, confirmPassword } = req.body;

    if (!email || !email.trim()) {
        res.status(400);
        throw new Error("Email address is required");
    }
    if (!name || !name.trim()) {
        res.status(400);
        throw new Error("Full name is required");
    }
    if (!usn || !usn.trim()) {
        res.status(400);
        throw new Error("USN is required");
    }
    if (!dob || !dob.trim()) {
        res.status(400);
        throw new Error("Date of birth is required");
    }
    if (!password) {
        res.status(400);
        throw new Error("Password is required");
    }
    if (confirmPassword && confirmPassword !== password) {
        res.status(400);
        throw new Error("Password and confirm password do not match");
    }
    if (password.length < 6) {
        res.status(400);
        throw new Error("Password must be at least 6 characters long");
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanUsn = normalizeUsn(usn);
    if (!cleanUsn) {
        res.status(400);
        throw new Error("Please enter a valid USN");
    }

    const normDob = normalizeDob(dob);
    if (!normDob) {
        res.status(400);
        throw new Error("Please enter a valid date of birth (valid calendar date, cannot be in the future).");
    }

    // Name sanitization preserves dots, spaces and initials
    const safeDisplayName = sanitizeDisplayName(name);

    // 1. Check if email is already registered with completed profile
    const existingByEmail = await User.findOne({ email: cleanEmail });
    if (existingByEmail && existingByEmail.registrationCompleted) {
        res.status(409);
        throw new Error("An account with this email address is already registered. Please sign in.");
    }

    // 2. Prevent another person from claiming an already registered USN
    const existingByUsn = await User.findOne({ usn: cleanUsn });
    if (existingByUsn && (!existingByEmail || existingByUsn._id.toString() !== existingByEmail._id.toString())) {
        res.status(409);
        throw new Error(`USN '${cleanUsn}' is already registered with an existing student account. Please contact the administrator.`);
    }

    // 3. Verify against authorised college student roster
    let rosterRecord = null;
    try {
        const { findApprovedByEmail, findApprovedByUsn } = require("../services/collegeRosterService");
        const rosterByEmail = await findApprovedByEmail(cleanEmail);
        const rosterByUsn = await findApprovedByUsn(cleanUsn);

        if (rosterByEmail) {
            rosterRecord = rosterByEmail;
            if (rosterByEmail.usn && cleanUsn !== normalizeUsn(rosterByEmail.usn)) {
                res.status(400);
                throw new Error("This USN does not match the college student record for this email.");
            }
            if (rosterByEmail.name && !compareNames(safeDisplayName, rosterByEmail.name)) {
                res.status(400);
                throw new Error("This name does not match your college student record. Please enter your name as in college records.");
            }
            if (normDob && rosterByEmail.dob && !compareDobs(rosterByEmail.dob, normDob)) {
                res.status(400);
                throw new Error("This date of birth does not match the one on record for your USN.");
            }
        } else if (rosterByUsn) {
            rosterRecord = rosterByUsn;
            if (rosterByUsn.email && cleanEmail !== rosterByUsn.email.toLowerCase().trim()) {
                res.status(400);
                throw new Error("This USN belongs to a different student in college records.");
            }
        }
    } catch (rErr) {
        if (rErr.status || res.statusCode >= 400) throw rErr;
    }

    // 4. Store full name, email, USN, DOB and hashed password in the MongoDB student record
    let user;
    if (existingByEmail) {
        // Update the pending student record
        existingByEmail.name = safeDisplayName;
        existingByEmail.usn = cleanUsn;
        existingByEmail.dob = normDob;
        existingByEmail.password = password; // hashed by pre-save
        existingByEmail.role = "student";
        existingByEmail.onboardingStep = "quiz";
        if (rosterRecord) {
            if (rosterRecord.branch) existingByEmail.branch = rosterRecord.branch;
            if (rosterRecord.college) existingByEmail.college = rosterRecord.college;
            if (rosterRecord.semester) existingByEmail.semester = rosterRecord.semester;
        }
        await existingByEmail.save();
        user = existingByEmail;
    } else {
        user = await User.create({
            name: safeDisplayName,
            email: cleanEmail,
            usn: cleanUsn,
            dob: normDob,
            password, // hashed by userSchema.pre('save')
            role: "student",
            branch: rosterRecord?.branch || undefined,
            college: rosterRecord?.college || "Malnad college of engineering",
            semester: rosterRecord?.semester || "Sixth",
            mobile: rosterRecord?.mobile || undefined,
            registrationCompleted: false,
            quizCompleted: false,
            onboardingStep: "quiz",
        });
    }

    const token = generateToken(user._id, user.role);
    res.status(201).json({
        success: true,
        message: "Step 1 completed successfully. Please tell us about yourself.",
        data: {
            _id: user._id,
            email: user.email,
            name: user.name,
            usn: user.usn,
            dob: user.dob,
            role: user.role,
            onboardingStep: "quiz",
            token,
        },
    });
});

// @desc   Step 2 — About You & Quiz (Preferred Name, Bio, Quiz Answers)
// @route  POST /api/auth/register-step2
const registerStep2 = asyncHandler(async (req, res) => {
    const { email, preferredName, bio, quizAnswers } = req.body;

    // Resolve user by email or by Authorization header
    let user = null;
    let authId = null;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        try {
            const jwt = require("jsonwebtoken");
            const decoded = jwt.verify(req.headers.authorization.split(" ")[1], process.env.JWT_SECRET);
            authId = decoded.id;
        } catch (e) { }
    }

    if (authId) {
        user = await User.findById(authId);
    }
    if (!user && email) {
        user = await User.findOne({ email: email.toLowerCase().trim() });
    }

    if (!user) {
        res.status(404);
        throw new Error("Student record not found. Please complete Step 1 first.");
    }

    // 1. Preferred name
    const safeNick = preferredName ? sanitizeDisplayName(preferredName) : (user.name ? user.name.split(" ")[0] : "Reader");
    user.preferredName = safeNick;

    // 2. Tell us about yourself (Bio)
    if (bio !== undefined) {
        user.bio = String(bio).trim().slice(0, 300);
    }

    // 3. Reading-interest quiz
    if (quizAnswers) {
        const quizEval = evaluateQuizSubmission(quizAnswers);
        if (!quizEval.valid) {
            res.status(400);
            throw new Error(quizEval.error || "Please complete all 6 questions in the student quiz.");
        }
        user.preferences = {
            genres: quizEval.genres || [],
            authors: [],
            subjects: user.branch ? [user.branch] : [],
        };
        user.quizAnswers = quizAnswers;
        user.quizCompleted = true;
    }

    user.registrationCompleted = true;
    user.onboardingStep = "completed";
    await user.save();

    // Trigger welcome email asynchronously
    try {
        const emailEventService = require("../services/emailEventService");
        emailEventService.onUserRegistered(user).catch((e) => console.warn("Welcome email note:", e.message));
    } catch (error) { }

    const token = generateToken(user._id, user.role);
    res.json({
        success: true,
        message: "Registration completed successfully.",
        data: {
            _id: user._id,
            name: user.name,
            email: user.email,
            usn: user.usn,
            dob: user.dob || "",
            role: user.role,
            branch: user.branch || "",
            college: user.college || "",
            semester: user.semester || "",
            preferredName: user.preferredName,
            bio: user.bio || "",
            preferences: user.preferences,
            registrationCompleted: true,
            quizCompleted: true,
            onboardingStep: "completed",
            token,
        },
    });
});
// @route  GET or POST /api/auth/check-email
const checkEmail = asyncHandler(async (req, res) => {
    const rawEmail = ((req.query && req.query.email) || (req.body && req.body.email) || "").toString().trim().toLowerCase();
    if (!rawEmail) {
        res.status(400);
        throw new Error("Email address is required");
    }
    const cleanEmail = rawEmail;
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
        let studentUsn = existing.usn || "";
        if (!studentUsn) {
            try {
                const { findApprovedByEmail } = require("../services/collegeRosterService");
                const roster = await findApprovedByEmail(cleanEmail);
                if (roster && roster.usn) studentUsn = roster.usn;
            } catch (e) { }
        }
        return res.json({
            success: true,
            isRegistered: true,
            needsOnboarding: existing.registrationCompleted === false,
            data: {
                name: existing.name,
                email: existing.email,
                role: existing.role,
                usn: studentUsn,
            },
        });
    }

    let rosterStudent = null;
    try {
        const { findApprovedByEmail } = require("../services/collegeRosterService");
        rosterStudent = await findApprovedByEmail(cleanEmail);
    } catch (e) { }

    return res.json({
        success: true,
        isRegistered: false,
        onRoster: !!rosterStudent,
        data: rosterStudent ? {
            name: rosterStudent.name,
            email: rosterStudent.email,
            usn: rosterStudent.usn || "",
            branch: rosterStudent.branch || "",
            college: rosterStudent.college || "",
        } : null,
    });
});

function validatePasswordRules(pw) {
    if (!pw || typeof pw !== "string") return "Password is required.";
    if (pw.length < 8 || pw.length > 64) return "Password must be between 8 and 64 characters.";
    if (!/[A-Z]/.test(pw)) return "Password must contain at least one uppercase letter.";
    if (!/[a-z]/.test(pw)) return "Password must contain at least one lowercase letter.";
    if (!/[0-9]/.test(pw)) return "Password must contain at least one number.";
    if (!/[^A-Za-z0-9]/.test(pw)) return "Password must contain at least one special character.";
    if (/\s/.test(pw)) return "Password must not contain spaces.";
    return null;
}

// @desc   Request 6-digit OTP for Forgot Password
// @route  POST /api/auth/forgot-password/request-otp
const forgotPasswordRequestOtp = asyncHandler(async (req, res) => {
    const rawEmail = (req.body.email || "").trim().toLowerCase();
    if (!rawEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
        return res.status(400).json({ success: false, message: "Please enter a valid email address." });
    }
    const cleanEmail = rawEmail;
    const user = await User.findOne({ email: cleanEmail }).select("+resetPasswordLastRequested +resetPasswordOtpExpires +resetPasswordOtpHash +resetPasswordOtpAttempts");

    // Generic success response to avoid email enumeration
    const genericSuccess = {
        success: true,
        message: "If an account exists with this email, a 6-digit verification code has been sent.",
    };

    if (!user) {
        // Constant-time delay to prevent timing attacks
        await new Promise((resolve) => setTimeout(resolve, 150));
        return res.json(genericSuccess);
    }

    // Cooldown check (60 seconds)
    if (user.resetPasswordLastRequested) {
        const timeSince = Date.now() - user.resetPasswordLastRequested.getTime();
        if (timeSince < 60 * 1000) {
            const waitSec = Math.ceil((60 * 1000 - timeSince) / 1000);
            return res.status(429).json({
                success: false,
                message: `Please wait ${waitSec} seconds before requesting a new code.`,
            });
        }
    }

    // Generate random 6-digit OTP
    const crypto = require("crypto");
    const otp = crypto.randomInt(100000, 1000000).toString(); // 6 digits: 100000 to 999999
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

    user.resetPasswordOtpHash = otpHash;
    user.resetPasswordOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    user.resetPasswordOtpAttempts = 0;
    user.resetPasswordLastRequested = new Date();
    user.passwordResetTokenHash = undefined;
    user.passwordResetTokenExpires = undefined;
    await user.save();

    // Send email using existing emailService (Resend)
    try {
        const { sendOtpNotification } = require("../services/emailService");
        await sendOtpNotification(user, otp, "BookNexus Account Password Reset", {
            expiryMinutes: 10,
        });
    } catch (err) {
        console.error("[ForgotPassword] Failed to send OTP email:", err.message);
    }

    return res.json(genericSuccess);
});

// @desc   Verify 6-digit OTP for Forgot Password
// @route  POST /api/auth/forgot-password/verify-otp
const forgotPasswordVerifyOtp = asyncHandler(async (req, res) => {
    const rawEmail = (req.body.email || "").trim().toLowerCase();
    const cleanOtp = String(req.body.otp || "").trim();

    if (!rawEmail || !cleanOtp) {
        return res.status(400).json({ success: false, message: "Email and verification code are required." });
    }
    if (!/^\d{6}$/.test(cleanOtp)) {
        return res.status(400).json({ success: false, message: "Verification code must be 6 digits." });
    }

    const cleanEmail = rawEmail;
    const user = await User.findOne({ email: cleanEmail }).select("+resetPasswordOtpHash +resetPasswordOtpExpires +resetPasswordOtpAttempts");

    if (!user || !user.resetPasswordOtpHash || !user.resetPasswordOtpExpires) {
        return res.status(400).json({ success: false, message: "Invalid or expired verification code. Please request a new code." });
    }

    // Expiry check
    if (user.resetPasswordOtpExpires.getTime() < Date.now()) {
        user.resetPasswordOtpHash = undefined;
        user.resetPasswordOtpExpires = undefined;
        await user.save();
        return res.status(400).json({ success: false, message: "Verification code has expired. Please request a new code." });
    }

    // Attempts limit check (max 5 attempts)
    if (user.resetPasswordOtpAttempts >= 5) {
        user.resetPasswordOtpHash = undefined;
        user.resetPasswordOtpExpires = undefined;
        await user.save();
        return res.status(429).json({ success: false, message: "Too many failed attempts. Please request a new verification code." });
    }

    user.resetPasswordOtpAttempts = (user.resetPasswordOtpAttempts || 0) + 1;

    const crypto = require("crypto");
    const candidateHash = crypto.createHash("sha256").update(cleanOtp).digest("hex");

    const isOtpValid = candidateHash === user.resetPasswordOtpHash;

    if (!isOtpValid) {
        await user.save();
        const remaining = Math.max(0, 5 - user.resetPasswordOtpAttempts);
        return res.status(400).json({
            success: false,
            message: `Invalid verification code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`,
        });
    }

    // OTP match! Clear OTP fields (single use) and issue single-use resetToken
    user.resetPasswordOtpHash = undefined;
    user.resetPasswordOtpExpires = undefined;
    user.resetPasswordOtpAttempts = 0;

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.passwordResetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.passwordResetTokenExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins to set password
    await user.save();

    return res.json({
        success: true,
        message: "Code verified successfully.",
        resetToken,
    });
});

// @desc   Reset BookNexus account password
// @route  POST /api/auth/forgot-password/reset-password
const forgotPasswordReset = asyncHandler(async (req, res) => {
    const rawEmail = (req.body.email || "").trim().toLowerCase();
    const resetToken = String(req.body.resetToken || "").trim();
    const newPassword = String(req.body.newPassword || "");
    const confirmPassword = String(req.body.confirmPassword || "");

    if (!rawEmail || !resetToken || !newPassword) {
        return res.status(400).json({ success: false, message: "All fields are required." });
    }
    if (newPassword !== confirmPassword) {
        return res.status(400).json({ success: false, message: "Passwords do not match." });
    }

    const pwError = validatePasswordRules(newPassword);
    if (pwError) {
        return res.status(400).json({ success: false, message: pwError });
    }

    const crypto = require("crypto");
    const tokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");

    const user = await User.findOne({ email: rawEmail }).select("+password +passwordResetTokenHash +passwordResetTokenExpires");

    if (!user || !user.passwordResetTokenHash || user.passwordResetTokenHash !== tokenHash || !user.passwordResetTokenExpires || user.passwordResetTokenExpires.getTime() < Date.now()) {
        return res.status(400).json({
            success: false,
            message: "Invalid or expired reset session. Please request a new verification code.",
        });
    }

    // Update password (triggers User pre-save bcrypt hash!)
    user.password = newPassword;
    user.passwordResetTokenHash = undefined;
    user.passwordResetTokenExpires = undefined;
    await user.save();

    return res.json({
        success: true,
        message: "Your BookNexus password has been reset successfully. You can now log in with your new password.",
    });
});

module.exports = {
    checkEmail,
    registerUser,
    registerStep1,
    registerStep2,
    loginUser,
    verifyRoleEligibility,
    roleLogin,
    completeOnboarding,
    getMe,
    updatePreferences,
    getEmailPreferences,
    updateEmailPreferences,
    logoutUser,
    forgotPasswordRequestOtp,
    forgotPasswordVerifyOtp,
    forgotPasswordReset,
};
