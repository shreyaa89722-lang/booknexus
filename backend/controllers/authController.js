const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");

// @desc   Register a new user
// @route  POST /api/auth/register
const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, role, preferences } = req.body;

    if (!name || !email || !password) {
        res.status(400);
        throw new Error("Name, email and password are required");
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
        res.status(400);
        throw new Error("A user with this email already exists");
    }

    const allowedRole = ["student", "owner", "admin"].includes(role) ? role : "student";

    const user = await User.create({
        name,
        email,
        password,
        role: allowedRole,
        preferences: preferences || {},
    });

    res.status(201).json({
        success: true,
        data: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            preferences: user.preferences,
            token: generateToken(user._id),
        },
    });
});

// @desc   Login a user
// @route  POST /api/auth/login
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400);
        throw new Error("Email and password are required");
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
        res.status(401);
        throw new Error("Invalid email or password");
    }

    res.json({
        success: true,
        data: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
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

// @desc   Update user preferences
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

module.exports = { registerUser, loginUser, getMe, updatePreferences };
