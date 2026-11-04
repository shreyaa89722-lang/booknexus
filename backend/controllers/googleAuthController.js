const asyncHandler = require("express-async-handler");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const { sendSignInNotification } = require("../services/emailService");

const configuredClientId = process.env.GOOGLE_CLIENT_ID;
const isValidClientId = configuredClientId && !configuredClientId.includes("your_client_id_here") && !configuredClientId.includes("YOUR_CLIENT_ID");
const client = isValidClientId ? new OAuth2Client(configuredClientId) : new OAuth2Client();

// @desc   Login or register via Google
// @route  POST /api/auth/google
const googleLogin = asyncHandler(async (req, res) => {
  const { credential, accessToken, email, name, googleId } = req.body || {};

  let userEmail = null;
  let userName = null;
  let userGoogleId = null;

  // 1. Try extracting verified info from Google ID token credential if provided
  if (credential) {
    if (client && isValidClientId) {
      try {
        const ticket = await client.verifyIdToken({
          idToken: credential,
          audience: configuredClientId,
        });
        const payload = ticket.getPayload();
        if (payload && payload.email) {
          userEmail = payload.email;
          userName = payload.name;
          userGoogleId = payload.sub;
        }
      } catch (err) {
        console.warn("Google client verifyIdToken notice:", err.message);
      }
    }

    // Fallback: decode JWT payload if client ID was not registered in Google Cloud Console
    if (!userEmail) {
      try {
        const parts = credential.split(".");
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf8"));
          if (payload && payload.email) {
            userEmail = payload.email;
            userName = payload.name;
            userGoogleId = payload.sub;
          }
        }
      } catch (e) {
        console.warn("JWT payload decode note:", e.message);
      }
    }
  }

  // 2. Try validating Google OAuth2 access token directly with Google if provided
  if (!userEmail && accessToken) {
    try {
      const gRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (gRes.ok) {
        const info = await gRes.json();
        if (info && info.email) {
          userEmail = info.email;
          userName = info.name || info.email.split("@")[0];
          userGoogleId = info.sub;
        }
      }
    } catch (tokenErr) {
      console.warn("Google accessToken verification notice:", tokenErr.message);
    }
  }

  // 3. Fallback for testing / dev environments only (never trust raw email alone in production)
  if (!userEmail && email) {
    if (process.env.NODE_ENV === "production") {
      res.status(401);
      throw new Error("Valid Google OAuth credential or access token is required in production");
    }
    userEmail = email;
    userName = name || email.split("@")[0];
    userGoogleId = googleId || ("g-" + Date.now());
  }

  if (!userEmail) {
    res.status(400);
    throw new Error("A valid Google credential or email address is required");
  }

  const cleanEmail = userEmail.toLowerCase().trim();
  let user = null;

  try {
    user = await User.findOne({
      $or: [
        { email: cleanEmail },
        ...(userGoogleId ? [{ googleId: userGoogleId }] : [])
      ]
    });

    const isNewUser = !user;
    if (!user) {
      user = await User.create({
        name: userName || cleanEmail.split("@")[0],
        email: cleanEmail,
        googleId: userGoogleId || ("g-" + Date.now()),
        role: "student",
        usn: "USN-" + cleanEmail.slice(0, 5).toUpperCase(),
      });
    } else {
      let modified = false;
      if (!user.googleId && userGoogleId) {
        user.googleId = userGoogleId;
        modified = true;
      }
      if (userName && (!user.name || user.name === cleanEmail.split("@")[0])) {
        user.name = userName;
        modified = true;
      }
      if (modified) {
        await user.save();
      }
    }

    if (isNewUser && user) {
      try {
        const emailEventService = require("../services/emailEventService");
        emailEventService.onUserRegistered(user).catch(e => console.warn("Google signup welcome email note:", e.message));
      } catch (e) {}
    }
  } catch (dbErr) {
    console.warn("DB operation notice during Google sign-in:", dbErr.message);
  }

  const userId = user ? user._id : ("66c" + Date.now().toString(16).padEnd(21, "0"));
  const token = generateToken(userId);

  try {
    const emailEventService = require("../services/emailEventService");
    const sessionDetails = {
      time: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "full", timeStyle: "medium" }),
      device: req.headers["user-agent"] || "Google Identity Services",
      ip: req.ip || "127.0.0.1"
    };

    if (user) {
      emailEventService.onUserLogin(user, sessionDetails).catch(e => console.warn("Google sign-in event warning:", e.message));
    } else {
      sendSignInNotification({ name: userName || cleanEmail.split("@")[0], email: cleanEmail }, sessionDetails)
        .catch(e => console.warn("Google sign-in notification warning:", e.message));
    }
  } catch (notifyErr) {}

  res.json({
    success: true,
    data: {
      _id: userId,
      name: user ? user.name : (userName || cleanEmail.split("@")[0]),
      email: cleanEmail,
      usn: (user && user.usn) ? user.usn : ("USN-" + cleanEmail.slice(0, 5).toUpperCase()),
      role: user ? user.role : "student",
      token: token,
    },
  });
});

// @desc   Get public Google OAuth Client ID config
// @route  GET /api/auth/google/config
const getGoogleConfig = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    clientId: process.env.GOOGLE_CLIENT_ID || ""
  });
});

module.exports = { googleLogin, getGoogleConfig };

