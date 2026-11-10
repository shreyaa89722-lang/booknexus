const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const User = require("../models/user");

// Checks that a valid login token was sent, and attaches the user to the request
const protect = asyncHandler(async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
        res.status(401);
        throw new Error("Not authorized, no token provided");
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // A registration (onboarding) token proves only that a Google email was
        // verified and is on the college roster. It is not a login token and
        // must never authorise a protected route.
        if (decoded && decoded.purpose === "onboarding") {
            res.status(401);
            throw new Error("Please finish registering, then sign in with Google.");
        }
        if (!decoded || !decoded.id) {
            res.status(401);
            throw new Error("Not authorized, malformed token");
        }

        req.user = await User.findById(decoded.id).select("-password");
        if (!req.user) {
            res.status(401);
            throw new Error("User no longer exists");
        }

        // Prevent incomplete student accounts from accessing protected features
        const currentUrl = req.originalUrl || req.url || "";
        if (
            req.user.role === "student" &&
            req.user.registrationCompleted === false &&
            !currentUrl.includes("/auth/me") &&
            !currentUrl.includes("/complete-onboarding")
        ) {
            res.status(403);
            throw new Error("Student onboarding incomplete. Please complete registration and quiz to access this feature.");
        }

        next();
    } catch (error) {
        if (res.statusCode !== 403) {
            res.status(401);
        }
        throw error;
    }
});

// Restricts a route to specific roles, e.g. authorize("admin")
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            res.status(403);
            throw new Error(`Role '${req.user?.role}' is not permitted to perform this action`);
        }
        next();
    };
};

module.exports = { protect, authorize };
