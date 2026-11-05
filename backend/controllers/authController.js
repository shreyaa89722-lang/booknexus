const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const { sendSignInNotification } = require("../services/emailService");
const { evaluateQuizSubmission } = require("../services/quizService");

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
    const cleanUsn = usn ? usn.toUpperCase().trim() : undefined;
    const cleanBranch = (branch || department || "").trim();
    const cleanCollege = (college || "Malnad college of engineering").trim();
    const cleanSemester = (semester || "Sixth").trim();

    // 1. Check email uniqueness
    const existingEmail = await User.findOne({ email: cleanEmail });
    if (existingEmail) {
        res.status(400);
        throw new Error("An account with this email address already exists. Please sign in instead.");
    }

    // 2. Check USN uniqueness if provided
    if (cleanUsn) {
        const existingUsn = await User.findOne({ usn: cleanUsn });
        if (existingUsn) {
            res.status(400);
            throw new Error(`USN '${cleanUsn}' is already registered with an existing student account.`);
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

    const allowedRole = ["student", "owner", "admin"].includes(role) ? role : "student";

    // 4. Create new student user
    const user = await User.create({
        name: name || (cleanUsn || cleanEmail.split("@")[0]),
        email: cleanEmail,
        password,
        role: allowedRole,
        usn: cleanUsn || undefined,
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
            role: user.role,
            branch: user.branch,
            college: user.college,
            semester: user.semester,
            registrationCompleted: user.registrationCompleted,
            quizCompleted: user.quizCompleted,
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
            role: user.role,
            branch: user.branch,
            college: user.college,
            semester: user.semester,
            registrationCompleted: user.registrationCompleted,
            quizCompleted: user.quizCompleted,
            preferences: user.preferences,
            emailPreferences: user.emailPreferences,
            token: generateToken(user._id),
        },
    });
});

// @desc   Complete student onboarding & genre quiz (for Google users or incomplete accounts)
// @route  POST /api/auth/complete-onboarding
const completeOnboarding = asyncHandler(async (req, res) => {
    // Determine target user from protect middleware or token/email in body
    let user = req.user;
    if (!user && req.body.email) {
        user = await User.findOne({ email: req.body.email.toLowerCase().trim() });
    } else if (!user && req.body.googleId) {
        user = await User.findOne({ googleId: req.body.googleId });
    }

    if (!user) {
        res.status(401);
        throw new Error("User account not found or not authenticated");
    }

    const { usn, mobile, branch, department, college, semester, quizAnswers } = req.body;

    if (!usn || !usn.trim()) {
        res.status(400);
        throw new Error("USN is required to complete student registration");
    }

    const cleanUsn = usn.toUpperCase().trim();

    // Verify USN is unique among other users
    const existingUsn = await User.findOne({ usn: cleanUsn, _id: { $ne: user._id } });
    if (existingUsn) {
        res.status(400);
        throw new Error(`USN '${cleanUsn}' is already registered to another account.`);
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
    user.usn = cleanUsn;
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

    await user.save();

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
            role: user.role,
            branch: user.branch,
            college: user.college,
            semester: user.semester,
            registrationCompleted: user.registrationCompleted,
            quizCompleted: user.quizCompleted,
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

module.exports = {
    registerUser,
    loginUser,
    completeOnboarding,
    getMe,
    updatePreferences,
    getEmailPreferences,
    updateEmailPreferences,
    logoutUser,
};
