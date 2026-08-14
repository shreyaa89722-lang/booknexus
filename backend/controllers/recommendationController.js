const asyncHandler = require("express-async-handler");
const { getRecommendationsForUser } = require("../services/recommendationService");

// @desc   Get personalized book recommendations for the logged-in user
// @route  GET /api/recommendations
const getMyRecommendations = asyncHandler(async (req, res) => {
  const limit = Number(req.query.limit) || 10;
  const recommendations = await getRecommendationsForUser(req.user, limit);

  res.json({
    success: true,
    data: recommendations.map(({ book, score }) => ({
      book,
      matchScore: score === null ? null : Number(score.toFixed(4)),
    })),
  });
});

module.exports = { getMyRecommendations };
