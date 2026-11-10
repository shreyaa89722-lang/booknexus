const asyncHandler = require("express-async-handler");
const User = require("../models/user");
const generateToken = require("../utils/generateToken");
const { evaluateQuizSubmission } = require("../services/quizService");
const { verifyOnboardingToken, bearerToken } = require("../utils/onboardingToken");
const {
    ROSTER_DENIED_MESSAGE,
    findApprovedByEmail,
    publicRosterView,
} = require("../services/collegeRosterService");
const {
    compareNames,
    sanitizeDisplayName,
    normalizeUsn,
    normalizeDob,
    compareDobs,
} = require("../utils/authIdentityUtils");

/**
 * First-time registration for a Google-verified, roster-approved student.
 *
 * Both endpoints below take the student's email ONLY from the purpose-scoped
 * onboarding token minted by POST /api/auth/google. An email, googleId or role
 * in the request body is ignored, so nobody can register against somebody
 * else's college email.
 */

/** Resolve the onboarding session: verified email + its approved college record. */
async function resolveOnboardingSession(req, res) {
    let session;
    try {
        session = verifyOnboardingToken(bearerToken(req));
    } catch (err) {
        res.status(401);
        throw new Error(
            "Your registration session has expired or is invalid. Please sign in with Google again."
        );
    }

    // Re-check the roster on every step: a student removed from college records
    // mid-registration must not be able to finish.
    const rosterRecord = await findApprovedByEmail(session.email);
    if (!rosterRecord) {
        res.status(403);
        throw new Error(ROSTER_DENIED_MESSAGE);
    }

    const existingUser = await User.findOne({ email: session.email });

    // The Google account in the token must not already belong elsewhere.
    if (session.googleId) {
        const googleIdHolder = await User.findOne({ googleId: session.googleId });
        if (googleIdHolder && googleIdHolder.email !== session.email) {
            res.status(403);
            throw new Error(
                "This Google account is already linked to a different BookNexus account."
            );
        }
    }
    if (existingUser && existingUser.googleId && session.googleId && existingUser.googleId !== session.googleId) {
        res.status(403);
        throw new Error(
            "This college email is already linked to a different Google account. Please use that Google account, or contact the librarian."
        );
    }

    return { session, rosterRecord, existingUser };
}

/**
 * Validate the step-1 identity details (full name, USN, date of birth) against
 * the approved college record and against anything the student already has
 * saved. Returns the values that will be written, or throws with a field hint.
 */
async function validateIdentity({ res, body, rosterRecord, existingUser }) {
    const submittedName = sanitizeDisplayName(body.name);
    const submittedUsn = normalizeUsn(body.usn);
    const submittedDob = body.dob ? normalizeDob(body.dob) : null;

    // --- Full name ---
    if (!submittedName || submittedName.length < 2) {
        res.status(400);
        const e = new Error("Please enter your full name as it appears in college records.");
        e.field = "name";
        throw e;
    }
    const nameMatchesRoster = compareNames(submittedName, rosterRecord.name);
    const nameMatchesSaved = existingUser && existingUser.name
        ? compareNames(submittedName, existingUser.name)
        : false;
    if (!nameMatchesRoster && !nameMatchesSaved) {
        res.status(400);
        const e = new Error(
            "This name does not match your college student record. Please enter your full name exactly as the college has it."
        );
        e.field = "name";
        throw e;
    }

    // --- USN ---
    // A student's own saved USN is never replaced; otherwise the roster decides.
    const expectedUsn = (existingUser && existingUser.usn) || rosterRecord.usn;
    if (!submittedUsn) {
        res.status(400);
        const e = new Error("Please enter your USN.");
        e.field = "usn";
        throw e;
    }
    if (submittedUsn !== normalizeUsn(expectedUsn)) {
        res.status(400);
        const e = new Error("This USN does not match the USN held for you in college records.");
        e.field = "usn";
        throw e;
    }

    // No other BookNexus account may already hold this USN.
    const usnHolder = await User.findOne({ usn: submittedUsn });
    if (usnHolder && (!existingUser || String(usnHolder._id) !== String(existingUser._id))) {
        res.status(409);
        const e = new Error(
            `USN ${submittedUsn} is already registered to another BookNexus account. Please contact the librarian.`
        );
        e.field = "usn";
        throw e;
    }

    // --- Date of birth ---
    // Permanent identity anchor: once set it is never overwritten, and it must
    // match college records whenever the college supplied one.
    if (!submittedDob) {
        res.status(400);
        const e = new Error(
            "Please enter a valid date of birth (a real past date, and at least 10 years ago)."
        );
        e.field = "dob";
        throw e;
    }
    const expectedDob = (existingUser && existingUser.dob) || rosterRecord.dob || "";
    if (expectedDob && !compareDobs(expectedDob, submittedDob)) {
        res.status(400);
        const e = new Error("This date of birth does not match the one on record for your USN.");
        e.field = "dob";
        throw e;
    }

    return {
        name: existingUser && existingUser.name ? existingUser.name : submittedName,
        usn: submittedUsn,
        // never overwrite a DOB that is already stored
        dob: (existingUser && existingUser.dob) || submittedDob,
    };
}

// @desc   Step 1 — verify a first-time student's identity against college records
// @route  POST /api/auth/onboarding/verify-identity
const verifyStudentIdentity = asyncHandler(async (req, res) => {
    const { rosterRecord, existingUser } = await resolveOnboardingSession(req, res);

    let verified;
    try {
        verified = await validateIdentity({
            res,
            body: req.body || {},
            rosterRecord,
            existingUser,
        });
    } catch (err) {
        if (err.field) {
            return res.status(res.statusCode >= 400 ? res.statusCode : 400).json({
                success: false,
                field: err.field,
                message: err.message,
            });
        }
        throw err;
    }

    res.json({
        success: true,
        message: "Your college details are verified. Please tell us a little about yourself.",
        data: {
            name: verified.name,
            usn: verified.usn,
            collegeRecord: publicRosterView(rosterRecord),
        },
    });
});

// @desc   Step 2 — save the verified profile + quiz and finish onboarding
// @route  POST /api/auth/complete-onboarding
const completeStudentOnboarding = asyncHandler(async (req, res) => {
    const { session, rosterRecord, existingUser } = await resolveOnboardingSession(req, res);
    const body = req.body || {};

    // Re-run every step-1 check server-side; the client is never trusted.
    let verified;
    try {
        verified = await validateIdentity({ res, body, rosterRecord, existingUser });
    } catch (err) {
        if (err.field) {
            return res.status(res.statusCode >= 400 ? res.statusCode : 400).json({
                success: false,
                step: 1,
                field: err.field,
                message: err.message,
            });
        }
        throw err;
    }

    // --- Step 2 fields ---
    const preferredName = String(body.preferredName || "").trim().replace(/\s+/g, " ");
    const bio = String(body.bio || "").trim();

    if (preferredName.length < 2 || preferredName.length > 30) {
        return res.status(400).json({
            success: false,
            step: 2,
            field: "preferredName",
            message: "Please tell us what we should call you (2 to 30 characters).",
        });
    }
    if (bio.length < 3 || bio.length > 300) {
        return res.status(400).json({
            success: false,
            step: 2,
            field: "bio",
            message: "Please write a short introduction about yourself (up to 300 characters).",
        });
    }

    const quizEval = evaluateQuizSubmission(body.quizAnswers);
    if (!quizEval.valid) {
        return res.status(400).json({
            success: false,
            step: 2,
            field: "quizAnswers",
            message: quizEval.error || "Please answer all questions in the reading-interest quiz.",
        });
    }

    const branch = rosterRecord.branch || (existingUser && existingUser.branch) || "";
    const college = rosterRecord.college || (existingUser && existingUser.college) || "";
    const semester = rosterRecord.semester || (existingUser && existingUser.semester) || "";
    const mobile = (existingUser && existingUser.mobile) || rosterRecord.mobile || "";

    let user = existingUser;
    try {
        if (!user) {
            // First BookNexus account for this approved college email.
            // Google authentication is sufficient — no second password is asked
            // for, so a random unusable secret is stored to satisfy the schema.
            user = new User({
                name: verified.name,
                email: session.email,
                password: "G!" + require("crypto").randomBytes(24).toString("base64url"),
                googleId: session.googleId || undefined,
                role: "student",
            });
        } else if (session.googleId && !user.googleId) {
            user.googleId = session.googleId;
        }

        // Identity fields: set once, never overwritten afterwards.
        user.usn = verified.usn;
        if (!user.dob) user.dob = verified.dob;
        if (!user.name || user.name.length < 2) user.name = verified.name;

        // Profile fields the student just supplied.
        user.preferredName = preferredName;
        user.bio = bio;
        user.quizAnswers = body.quizAnswers;
        user.quizCompleted = true;
        user.registrationCompleted = true;
        user.onboardingStep = "completed";
        user.role = user.role === "student" ? "student" : user.role;

        if (branch) user.branch = branch;
        if (college) user.college = college;
        if (semester) user.semester = semester;
        if (mobile) user.mobile = mobile;

        user.preferences = {
            genres: quizEval.genres,
            authors: (user.preferences && user.preferences.authors) || [],
            subjects: branch
                ? [branch]
                : (user.preferences && user.preferences.subjects) || [],
        };

        await user.save();
    } catch (saveErr) {
        if (saveErr.code === 11000) {
            const dupeField = Object.keys(saveErr.keyPattern || {})[0] || "account";
            return res.status(409).json({
                success: false,
                field: dupeField === "usn" ? "usn" : undefined,
                message:
                    dupeField === "usn"
                        ? `USN ${verified.usn} was just registered by another request. Please contact the librarian.`
                        : "This account was just registered by another request. Please sign in with Google again.",
            });
        }
        throw saveErr;
    }

    try {
        const emailEventService = require("../services/emailEventService");
        emailEventService.onUserRegistered(user).catch(() => {});
    } catch (e) {
        /* best effort */
    }

    res.json({
        success: true,
        message: "Welcome to BookNexus! Your student profile is ready.",
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
            mobile: user.mobile || "",
            preferredName: user.preferredName || "",
            bio: user.bio || "",
            preferences: user.preferences,
            registrationCompleted: true,
            quizCompleted: true,
            onboardingStep: "completed",
            token: generateToken(user._id, user.role),
        },
    });
});

module.exports = { verifyStudentIdentity, completeStudentOnboarding };
