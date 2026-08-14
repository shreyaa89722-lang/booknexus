const Book = require("../models/Book");
const Rental = require("../models/Rental");

// Turns a list of words into a frequency map, e.g. ["Sci-Fi","Sci-Fi"] -> { "sci-fi": 2 }
function buildVector(tokens) {
  const vector = {};
  tokens
    .filter(Boolean)
    .map((t) => t.toString().trim().toLowerCase())
    .forEach((token) => {
      vector[token] = (vector[token] || 0) + 1;
    });
  return vector;
}

// Compares two frequency maps and returns a similarity score between 0 and 1
function cosineSimilarity(vecA, vecB) {
  const keys = new Set([...Object.keys(vecA), ...Object.keys(vecB)]);
  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (const key of keys) {
    const a = vecA[key] || 0;
    const b = vecB[key] || 0;
    dot += a * b;
    magA += a * a;
    magB += b * b;
  }

  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

function bookToTokens(book) {
  return [book.genre, book.author, book.subject];
}

// Builds the user's "fingerprint" from stated preferences + past rental history
async function buildUserVector(user) {
  const explicitTokens = [
    ...(user.preferences?.genres || []),
    ...(user.preferences?.authors || []),
    ...(user.preferences?.subjects || []),
  ];

  const pastRentals = await Rental.find({
    renter: user._id,
    status: { $in: ["active", "returned", "overdue"] },
  }).populate("book");

  const historyTokens = pastRentals.flatMap((r) => (r.book ? bookToTokens(r.book) : []));

  // History counts double - it's a stronger signal than stated preference
  return buildVector([...explicitTokens, ...historyTokens, ...historyTokens]);
}

// Main function: returns the top-N recommended books for a user
async function getRecommendationsForUser(user, limit = 10) {
  const userVector = await buildUserVector(user);

  const excludedRentals = await Rental.find({ renter: user._id }).select("book");
  const excludedIds = excludedRentals.map((r) => r.book.toString());

  const candidateBooks = await Book.find({
    _id: { $nin: excludedIds },
    availability: "available",
  });

  const hasSignal = Object.keys(userVector).length > 0;
  if (!hasSignal) {
    return candidateBooks
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit)
      .map((book) => ({ book, score: null }));
  }

  const scored = candidateBooks.map((book) => ({
    book,
    score: cosineSimilarity(userVector, buildVector(bookToTokens(book))),
  }));

  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}

module.exports = { getRecommendationsForUser };
