const asyncHandler = require("express-async-handler");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/user");
const generateToken = require("../utils/generateToken");
const { sendSignInNotification } = require("../services/emailService");

const configuredClientId = process.env.GOOGLE_CLIENT_ID;
const isValidClientId =
    configuredClientId &&
    !configuredClientId.includes("your_client_id_here") &&
    !configuredClientId.includes("YOUR_CLIENT_ID");
const client = isValidClientId ? new OAuth2Client(configuredClientId) : new OAuth2Client();

// @desc   Login or register via Google (ID Token or Access Token)
// @route  POST /api/auth/google
const googleLogin = asyncHandler(async (req, res) => {
    const { credential, accessToken } = req.body || {};

    let userEmail = null;
    let userName = null;
    let userGoogleId = null;

    // 1. Primary: Cryptographically verify Google ID token credential using official google-auth-library
    if (credential) {
        if (!isValidClientId) {
            res.status(500);
            throw new Error("Google OAuth Client ID is not configured on the server");
        }
        try {
            const ticket = await client.verifyIdToken({
                idToken: credential,
                audience: configuredClientId,
            });
            const payload = ticket.getPayload();
            if (!payload) {
                res.status(401);
                throw new Error("Google ID token verification returned an empty payload");
            }
            // Strict audience & issuer verification
            const validIssuers = ["accounts.google.com", "https://accounts.google.com"];
            if (!validIssuers.includes(payload.iss)) {
                res.status(401);
                throw new Error("Google ID token issuer is invalid: " + payload.iss);
            }
            if (payload.aud !== configuredClientId) {
                res.status(401);
                throw new Error("Google ID token audience mismatch");
            }
            if (!payload.email) {
                res.status(400);
                throw new Error("Google account payload did not contain an email address");
            }
            if (payload.email_verified === false) {
                res.status(401);
                throw new Error("Your Google email is not verified. Please verify your Google account before signing in.");
            }
            userEmail = payload.email;
            userName = payload.name || payload.email.split("@")[0];
            userGoogleId = payload.sub;
        } catch (err) {
            console.warn("Google client verifyIdToken error:", err.message);
            res.status(401);
            throw new Error("Google token verification failed: " + err.message);
        }
    }
    // 2. Secondary: OAuth2 Access Token fallback verified directly with Google
    else if (accessToken) {
        try {
            const gRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (!gRes.ok) {
                res.status(401);
                throw new Error("Failed to verify Google access token with Google API");
            }
            const info = await gRes.json();
            if (!info || !info.email) {
                res.status(400);
                throw new Error("Google userinfo did not contain an email address");
            }
            if (info.email_verified === false) {
                res.status(401);
                throw new Error("Your Google email is not verified. Please verify your Google account before signing in.");
            }
            userEmail = info.email;
            userName = info.name || info.email.split("@")[0];
            userGoogleId = info.sub;
        } catch (tokenErr) {
            console.warn("Google accessToken verification error:", tokenErr.message);
            res.status(401);
            throw new Error("Google access token verification failed: " + tokenErr.message);
        }
    } else {
        res.status(400);
        throw new Error("A valid Google ID token credential or access token is required.");
    }

    if (!userEmail) {
        res.status(400);
        throw new Error("A valid Google credential or verified email address is required");
    }

    const cleanEmail = userEmail.toLowerCase().trim();
    let user = null;

    try {
        // Find existing user by googleId or email
        user = await User.findOne({
            $or: [
                ...(userGoogleId ? [{ googleId: userGoogleId }] : []),
                { email: cleanEmail },
            ],
        });

        // Case A: Completely New Google User -> Create provisional account needing onboarding
        if (!user) {
            const provisionalPassword = "GAuth#" + Math.random().toString(36).slice(-8) + "Aa1!";
            user = await User.create({
                name: userName || cleanEmail.split("@")[0],
                email: cleanEmail,
                password: provisionalPassword,
                googleId: userGoogleId || ("g-" + Date.now()),
                role: "student",
                registrationCompleted: false,
                quizCompleted: false,
                onboardingStep: "details",
                preferences: { genres: [], authors: [], subjects: [] },
            });

            const token = generateToken(user._id);

            return res.status(200).json({
                success: true,
                isNewUser: true,
                needsOnboarding: true,
                message: "First-time Google sign-in detected. Please complete student onboarding.",
                data: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    googleId: user.googleId,
                    role: user.role,
                    registrationCompleted: false,
                    quizCompleted: false,
                    onboardingStep: "details",
                    token,
                },
            });
        }

        // Case B: Existing user found - Link Google ID if not yet linked
        let updates = {};
        if (!user.googleId && userGoogleId) {
            updates.googleId = userGoogleId;
            user.googleId = userGoogleId;
        }
        if (userName && (!user.name || user.name === cleanEmail.split("@")[0])) {
            updates.name = userName;
            user.name = userName;
        }
        if (Object.keys(updates).length > 0) {
            await User.updateOne({ _id: user._id }, { $set: updates });
        }

        // Case C: Existing user whose onboarding or quiz is incomplete
        if (user.registrationCompleted === false || user.quizCompleted === false) {
            const token = generateToken(user._id);
            return res.status(200).json({
                success: true,
                isNewUser: false,
                needsOnboarding: true,
                message: "Please complete your student profile and quiz to continue.",
                data: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    usn: user.usn || "",
                    dob: user.dob || "",
                    mobile: user.mobile || "",
                    branch: user.branch || "",
                    college: user.college || "",
                    semester: user.semester || "",
                    preferredName: user.preferredName || "",
                    bio: user.bio || "",
                    googleId: user.googleId,
                    role: user.role,
                    registrationCompleted: false,
                    quizCompleted: user.quizCompleted || false,
                    onboardingStep: user.onboardingStep || "details",
                    token,
                },
            });
        }
    } catch (dbErr) {
        console.warn("DB operation notice during Google sign-in:", dbErr.message);
        res.status(500);
        throw new Error("Database error during Google sign-in: " + dbErr.message);
    }

    // Case D: Returning Google User with complete registration -> Direct Login!
    const userId = user ? user._id : ("66c" + Date.now().toString(16).padEnd(21, "0"));
    const token = generateToken(userId);

    try {
        const emailEventService = require("../services/emailEventService");
        const sessionDetails = {
            time: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "full", timeStyle: "medium" }),
            device: req.headers["user-agent"] || "Google Identity Services",
            ip: req.ip || "127.0.0.1",
        };

        if (user) {
            emailEventService.onUserLogin(user, sessionDetails).catch((e) =>
                console.warn("Google sign-in event warning:", e.message)
            );
        } else {
            sendSignInNotification({ name: userName || cleanEmail.split("@")[0], email: cleanEmail }, sessionDetails)
                .catch((e) => console.warn("Google sign-in notification warning:", e.message));
        }
    } catch (notifyErr) {}

    res.json({
        success: true,
        isNewUser: false,
        needsOnboarding: false,
        data: {
            _id: userId,
            name: user ? user.name : (userName || cleanEmail.split("@")[0]),
            email: cleanEmail,
            usn: user && user.usn ? user.usn : "",
            preferredName: user && user.preferredName ? user.preferredName : (user ? user.name.split(" ")[0] : (userName || cleanEmail.split("@")[0])),
            bio: user && user.bio ? user.bio : "",
            role: user ? user.role : "student",
            branch: user ? user.branch : "",
            college: user ? user.college : "",
            semester: user ? user.semester : "",
            registrationCompleted: true,
            quizCompleted: user ? user.quizCompleted : true,
            preferences: user ? user.preferences : {},
            token: token,
        },
    });
});

// @desc   Get public Google OAuth Client ID config
// @route  GET /api/auth/google/config
const getGoogleConfig = asyncHandler(async (req, res) => {
    res.json({
        success: true,
        clientId: process.env.GOOGLE_CLIENT_ID || "",
    });
});

module.exports = { googleLogin, getGoogleConfig };
