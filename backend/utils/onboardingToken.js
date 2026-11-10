const jwt = require("jsonwebtoken");

/**
 * Short-lived, purpose-scoped onboarding tokens.
 *
 * When a student's Google account is verified AND found in college records but
 * they have no BookNexus profile yet, we do not create a user document and we
 * do not issue a login token. Instead we issue an onboarding token that:
 *
 *   - carries the Google-verified email and subject id (never a client value),
 *   - is marked `purpose: "onboarding"` so it cannot be used as a login token,
 *   - expires in 30 minutes.
 *
 * Registration endpoints take the email from this token, never from the body.
 */

const ONBOARDING_PURPOSE = "onboarding";
const ONBOARDING_TTL = "30m";

function signOnboardingToken({ email, googleId, name }) {
    if (!email) throw new Error("Cannot issue an onboarding token without a verified email");
    return jwt.sign(
        {
            purpose: ONBOARDING_PURPOSE,
            email: String(email).trim().toLowerCase(),
            googleId: googleId || null,
            name: name || "",
        },
        process.env.JWT_SECRET,
        { expiresIn: ONBOARDING_TTL }
    );
}

/**
 * Verify an onboarding token. Throws when the signature is bad, the token has
 * expired, or the token is any other kind of token (e.g. a normal login JWT).
 */
function verifyOnboardingToken(token) {
    if (!token) throw new Error("Onboarding token is required");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || decoded.purpose !== ONBOARDING_PURPOSE) {
        throw new Error("This token is not a valid registration token");
    }
    if (!decoded.email) {
        throw new Error("Registration token does not carry a verified email");
    }
    return {
        email: String(decoded.email).trim().toLowerCase(),
        googleId: decoded.googleId || null,
        name: decoded.name || "",
    };
}

/** Pull a bearer token out of the Authorization header. */
function bearerToken(req) {
    const header = req.headers && req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) return null;
    const value = header.slice(7).trim();
    return value || null;
}

module.exports = {
    ONBOARDING_PURPOSE,
    signOnboardingToken,
    verifyOnboardingToken,
    bearerToken,
};
