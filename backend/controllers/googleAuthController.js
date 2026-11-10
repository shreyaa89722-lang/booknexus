const asyncHandler = require("express-async-handler");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/user");
const generateToken = require("../utils/generateToken");

const configuredClientId = process.env.GOOGLE_CLIENT_ID;
const isValidClientId =
    configuredClientId &&
    !configuredClientId.includes("your_client_id_here") &&
    !configuredClientId.includes("YOUR_CLIENT_ID");
const client = isValidClientId ? new OAuth2Client(configuredClientId) : new OAuth2Client();

const VALID_ISSUERS = ["accounts.google.com", "https://accounts.google.com"];

const UNREGISTERED_GOOGLE_MESSAGE =
    "This Gmail is not registered. Please contact the administrator.";

/** Trim + lowercase an email so comparison is whitespace- and case-insensitive. */
function normalizeEmail(email) {
    if (!email) return "";
    return String(email).trim().toLowerCase();
}

/**
 * Cryptographically verify a Google ID token with Google's official library.
 *
 * Checks, in order: signature (against Google's published JWKs), audience
 * (our OAuth client id), issuer, expiry, presence of an email, and email_verified.
 * Nothing in the request body is trusted — the email is taken only from the
 * verified token payload.
 */
async function verifyGoogleIdToken(credential) {
    if (!isValidClientId) {
        const err = new Error("Google OAuth Client ID is not configured on the server");
        err.status = 500;
        throw err;
    }

    let payload;
    try {
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: configuredClientId,
        });
        payload = ticket.getPayload();
    } catch (e) {
        console.warn("Google verifyIdToken failed:", e.message);
        const err = new Error("Google sign-in could not be verified. Please try again.");
        err.status = 401;
        throw err;
    }

    if (!payload) {
        const err = new Error("Google sign-in could not be verified. Please try again.");
        err.status = 401;
        throw err;
    }
    if (!VALID_ISSUERS.includes(payload.iss)) {
        const err = new Error("Google sign-in could not be verified (unexpected token issuer).");
        err.status = 401;
        throw err;
    }
    if (payload.aud !== configuredClientId) {
        const err = new Error("Google sign-in could not be verified (token audience mismatch).");
        err.status = 401;
        throw err;
    }
    if (!payload.email) {
        const err = new Error("Your Google account did not share an email address.");
        err.status = 400;
        throw err;
    }
    if (payload.email_verified !== true) {
        const err = new Error(
            "Your Google email address is not verified. Please verify it with Google and try again."
        );
        err.status = 401;
        throw err;
    }
    if (!payload.sub) {
        const err = new Error("Google sign-in could not be verified (missing subject).");
        err.status = 401;
        throw err;
    }

    return {
        email: normalizeEmail(payload.email),
        googleId: String(payload.sub),
        name: payload.name || normalizeEmail(payload.email).split("@")[0],
    };
}

function studentPayload(user, token) {
    return {
        _id: user._id,
        name: user.name,
        email: user.email,
        usn: user.usn || "",
        dob: user.dob || "",
        role: user.role || "student",
        branch: user.branch || "",
        college: user.college || "",
        semester: user.semester || "",
        mobile: user.mobile || "",
        preferredName: user.preferredName || (user.name ? user.name.split(" ")[0] : ""),
        bio: user.bio || "",
        preferences: user.preferences || { genres: [], authors: [], subjects: [] },
        emailPreferences: user.emailPreferences,
        registrationCompleted: true,
        quizCompleted: true,
        onboardingStep: "completed",
        token,
    };
}

// @desc   Sign in with Google. Matches verified Google email with registered MongoDB user.
// @route  POST /api/auth/google
const googleLogin = asyncHandler(async (req, res) => {
    const { credential, accessToken } = req.body || {};

    if (!credential && !accessToken) {
        res.status(400);
        throw new Error(
            "A Google ID token is required. Please sign in through the Google account chooser."
        );
    }

    // 1-5. Securely verify Google token. Email is taken ONLY from verified payload.
    let verified;
    try {
        if (credential) {
            verified = await verifyGoogleIdToken(credential);
        } else {
            // OAuth2 Access Token fallback verified directly with Google UserInfo API
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
            verified = {
                email: normalizeEmail(info.email),
                googleId: String(info.sub),
                name: info.name || normalizeEmail(info.email).split("@")[0],
            };
        }
    } catch (err) {
        res.status(err.status || 401);
        throw err;
    }

    const { email, googleId } = verified;
    const cleanEmail = normalizeEmail(email);

    // 6. Compare verified Google email with student's existing registered college email in MongoDB
    const existingUser = await User.findOne({
        $or: [
            { email: cleanEmail },
            ...(googleId ? [{ googleId }] : [])
        ]
    });

    // If the Google email does not match an existing registered user in MongoDB:
    // Reject login, show message, do not create an account or session.
    if (!existingUser) {
        res.status(403);
        throw new Error(UNREGISTERED_GOOGLE_MESSAGE);
    }

    // If the Google email matches:
    // Safely link Google ID if not yet mapped
    if (!existingUser.googleId && googleId) {
        await User.updateOne({ _id: existingUser._id }, { $set: { googleId } });
        existingUser.googleId = googleId;
    }

    // Create a secure login session
    const token = generateToken(existingUser._id, existingUser.role);
    notifySignIn(existingUser, req);

    // If staff account (librarian or admin)
    if (existingUser.role === "admin" || existingUser.role === "librarian") {
        return res.json({
            success: true,
            isNewUser: false,
            needsOnboarding: false,
            data: {
                _id: existingUser._id,
                name: existingUser.name,
                email: existingUser.email,
                role: existingUser.role,
                adminId: existingUser.adminId || "",
                librarianId: existingUser.librarianId || "",
                registrationCompleted: true,
                quizCompleted: true,
                token,
            },
        });
    }

    // Authenticate existing student, load profile and role, open home page directly
    return res.json({
        success: true,
        isNewUser: false,
        needsOnboarding: false,
        data: studentPayload(existingUser, token),
    });
});

function notifySignIn(user, req) {
    try {
        const emailEventService = require("../services/emailEventService");
        emailEventService
            .onUserLogin(user, {
                time: new Date().toLocaleString("en-IN", {
                    timeZone: "Asia/Kolkata",
                    dateStyle: "full",
                    timeStyle: "medium",
                }),
                device: req.headers["user-agent"] || "Google Identity Services",
                ip: req.ip || "127.0.0.1",
            })
            .catch((e) => console.warn("Google sign-in event warning:", e.message));
    } catch (e) {
        /* notifications are best-effort and never block a sign-in */
    }
}

// @desc   Get public Google OAuth Client ID config
// @route  GET /api/auth/google/config
const getGoogleConfig = asyncHandler(async (req, res) => {
    res.json({
        success: true,
        clientId: process.env.GOOGLE_CLIENT_ID || "",
    });
});

module.exports = {
    googleLogin,
    getGoogleConfig,
    verifyGoogleIdToken,
    normalizeEmail,
    UNREGISTERED_GOOGLE_MESSAGE,
};
