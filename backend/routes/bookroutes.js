const express = require("express");
const {
  createBook,
  getBooks,
  getBookById,
  updateBook,
  deleteBook,
} = require("../controllers/bookController");
const { protect, authorize } = require("../middleware/authMiddleware");
const { validate, bookRules } = require("../middleware/validators");

const router = express.Router();

router.route("/")
  .get(getBooks)
  .post(protect, authorize("owner", "admin"), bookRules, validate, createBook);

router.route("/:id")
  .get(getBookById)
  .put(protect, updateBook)
  .delete(protect, deleteBook);

module.exports = router;
