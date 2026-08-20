const { body, validationResult } = require("express-validator");

// Runs after the rule chains below; collects errors into one clean response
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    return res.json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

const registerRules = [
  body("name").trim().notEmpty().withMessage("Name is required").isLength({ max: 100 }),
  body("email").trim().isEmail().withMessage("Must be a valid email").normalizeEmail(),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  body("role").optional().isIn(["student", "owner", "admin"]).withMessage("Role must be student, owner, or admin"),
];

const loginRules = [
  body("email").trim().isEmail().withMessage("Must be a valid email").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
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

module.exports = { validate, registerRules, loginRules, bookRules, rentalRequestRules };
