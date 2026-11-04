const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const { sendEmail, sendSignInNotification } = require("../services/emailService");
const { welcomeEmail } = require("../services/emailTemplates");

// @desc   Register a new user
// @route  POST /api/auth/register
const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, role, preferences, usn, mobile, branch, college, semester } = req.body;

    if (!email || !password) {
        res.status(400);
        throw new Error("Email and password are required");
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanUsn = (usn || "").toUpperCase().trim();

    let user = await User.findOne({
        $or: [
            { email: cleanEmail },
            ...(cleanUsn ? [{ usn: cleanUsn }] : [])
        ]
    });

    const allowedRole = ["student", "owner", "admin"].includes(role) ? role : "student";

    const isNewUser = !user;
    if (user) {
        // User already in database: update their credentials and details
        if (name) user.name = name;
        user.password = password;
        if (cleanUsn) user.usn = cleanUsn;
        if (mobile) user.mobile = mobile;
        if (branch) user.branch = branch;
        if (college) user.college = college;
        if (semester) user.semester = semester;
        if (preferences) user.preferences = preferences;
        await user.save();
    } else {
        user = await User.create({
            name: name || (cleanUsn || cleanEmail.split("@")[0]),
            email: cleanEmail,
            password,
            role: allowedRole,
            usn: cleanUsn || undefined,
            mobile: mobile || undefined,
            branch: branch || undefined,
            college: college || undefined,
            semester: semester || undefined,
            preferences: preferences || {},
        });
    }

    if (isNewUser) {
        try {
            const emailEventService = require("../services/emailEventService");
            emailEventService.onUserRegistered(user).catch(e => console.warn("Welcome email note:", e.message));
        } catch (error) {
            console.error("Welcome email failed:", error.message);
        }
    }

    res.status(201).json({
        success: true,
        data: {
            _id: user._id,
            name: user.name,
            email: user.email,
            usn: user.usn,
            role: user.role,
            preferences: user.preferences,
            emailPreferences: user.emailPreferences,
            token: generateToken(user._id),
        },
    });
});

// @desc   Login a user
// @route  POST /api/auth/login
const loginUser = asyncHandler(async (req, res) => {
    const identifier = (req.body.identifier || req.body.usn || req.body.email || "").trim();
    const { password } = req.body;

    if (!identifier || !password) {
        res.status(400);
        throw new Error("Email/USN and password are required");
    }

    const user = await User.findOne({
        $or: [
            { email: identifier.toLowerCase() },
            { usn: { $regex: new RegExp(`^${identifier}$`, "i") } }
        ]
    }).select("+password");

    if (!user || !(await user.comparePassword(password))) {
        res.status(401);
        throw new Error("Invalid credentials");
    }

    try {
        const emailEventService = require("../services/emailEventService");
        emailEventService.onUserLogin(user, {
            time: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "full", timeStyle: "medium" }),
            device: req.headers["user-agent"] || "Web Browser",
            ip: req.ip || "127.0.0.1"
        }).catch(e => console.warn("Sign-in notification warning:", e.message));
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
            preferences: user.preferences,
            emailPreferences: user.emailPreferences,
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
                    ...(req.body.userId ? [{ _id: req.body.userId }] : [])
                ]
            });
        }
        if (userToNotify) {
            const emailEventService = require("../services/emailEventService");
            emailEventService.onUserLogout(userToNotify, {
                time: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "full", timeStyle: "medium" }),
                device: req.headers["user-agent"] || "Web Browser",
                ip: req.ip || "127.0.0.1"
            }).catch(e => console.warn("Logout notification warning:", e.message));
        }
    } catch (e) {}

    res.json({ success: true, message: "Logged out successfully" });
});

module.exports = {
    registerUser,
    loginUser,
    getMe,
    updatePreferences,
    getEmailPreferences,
    updateEmailPreferences,
    logoutUser,
};
