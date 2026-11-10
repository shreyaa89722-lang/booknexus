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
            usn: cleanUsn || undefined,
            dob: normDob || undefined,
            mobile: mobile ? String(mobile).trim() : undefined,
            branch: cleanBranch || undefined,
            college: cleanCollege,
            semester: cleanSemester,
            registrationCompleted: true,
            quizCompleted: isQuizDone,
            quizAnswers: quizAnswers || null,
            onboardingStep: "completed",
            preferences: {
                genres: genrePreferences,
                authors: [],
                subjects: cleanBranch ? [cleanBranch] : [],
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
    } catch (notifyErr) {}

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
                await User.deleteOne({ _id: user._id }).catch(() => {});
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
        emailEventService.onUserRegistered(user).catch(() => {});
    } catch (e) {}

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
        }).catch(() => {});
    } catch (e) {}

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
    } catch (e) {}

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
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
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
    } catch (notifyErr) {}

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

module.exports = {
    registerUser,
    loginUser,
    verifyRoleEligibility,
    roleLogin,
    completeOnboarding,
    getMe,
    updatePreferences,
    getEmailPreferences,
    updateEmailPreferences,
    logoutUser,
};
