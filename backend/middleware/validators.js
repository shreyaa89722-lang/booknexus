const { body, validationResult } = require("express-validator");

// Runs after the rule chains below; collects errors into one clean response
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    return res.json({
      success: false,
      message: errors.array()[0]?.msg || "Validation failed",
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

const registerRules = [
  body("name").trim().notEmpty().withMessage("Full name is required").isLength({ max: 100 }),
  body("email").trim().isEmail().withMessage("Must be a valid email address").normalizeEmail(),
  body("usn").optional().trim().customSanitizer(v => (v ? v.toUpperCase() : v)),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  body("confirmPassword").optional().custom((val, { req }) => {
    if (val && val !== req.body.password) {
      throw new Error("Password and confirm password do not match");
    }
    return true;
  }),
  body("role").optional().custom((val) => {
    if (val === "admin" || val === "librarian") {
      throw new Error("Direct registration for administrative roles is not permitted");
    }
    if (!["student", "owner"].includes(val)) {
      throw new Error("Role must be student");
    }
    return true;
  }),
];

const loginRules = [
  body().custom((value, { req }) => {
    const id = req.body.email || req.body.usn || req.body.identifier;
    if (!id || typeof id !== "string" || !id.trim()) {
      throw new Error("USN or Email is required");
    }
    return true;
  }),
  body("password").notEmpty().withMessage("Password is required"),
];

const onboardingRules = [
  body("usn").trim().notEmpty().withMessage("USN is required").customSanitizer(v => (v ? v.toUpperCase() : v)),
  body("mobile").optional().trim(),
  body("branch").optional().trim(),
  body("semester").optional().trim(),
];

const bookRules = [
  body("title").trim().notEmpty().withMessage("Title is required").isLength({ max: 200 }),
  body("author").trim().notEmpty().withMessage("Author is required").isLength({ max: 150 }),
  body("genre").trim().notEmpty().withMessage("Genre is required"),
  body("subject").trim().notEmpty().withMessage("Subject is required"),
  body("listingType").optional().isIn(["library", "p2p"]),
  body("rentalPricePerWeek").optional().isFloat({ min: 0 }).withMessage("Price must be a positive number"),
];

const rentalRequestRules = [
  body("bookId").notEmpty().withMessage("bookId is required").isMongoId().withMessage("bookId must be a valid id"),
];

module.exports = { validate, registerRules, loginRules, onboardingRules, bookRules, rentalRequestRules };
