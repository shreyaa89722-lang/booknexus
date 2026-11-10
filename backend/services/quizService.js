/**
 * BOOKNEXUS - LITERARY & ACADEMIC GENRE DISCOVERY QUIZ SERVICE
 * Validates student onboarding quiz submissions and calculates personalized genre preferences
 * which power the Cosine Similarity Recommendation Engine.
 */

const NX_GENRES = [
    "Fiction",
    "Non-fiction",
    "Science",
    "Engineering",
    "Computer Science",
    "Mathematics",
    "Philosophy",
    "History",
    "Biography",
    "Self-help",
    "Academic/Textbook",
    "Literature",
];

const NX_QUIZ = [
    {
        id: 0,
        q: "What pulls you into a book?",
        w: 2,
        opts: [
            ["a", "A story to get lost in", ["Fiction", "Literature"]],
            ["b", "Something real that happened", ["Non-fiction", "History", "Biography"]],
            ["c", "How things work", ["Science", "Engineering", "Computer Science"]],
            ["d", "Ideas that change how I think", ["Philosophy", "Literature"]],
            ["e", "Ways to improve my life", ["Self-help", "Non-fiction"]],
            ["f", "Clear explanations for my course", ["Academic/Textbook", "Mathematics"]],
        ],
    },
    {
        id: 1,
        q: "It's midnight and the library is yours. Where do you wander?",
        w: 2,
        opts: [
            ["a", "Fantasy, novels and classics", ["Fiction", "Literature"]],
            ["b", "Old maps and dusty archives", ["History", "Biography"]],
            ["c", "Circuit boards and lab manuals", ["Engineering", "Science", "Computer Science"]],
            ["d", "A quiet corner with big questions", ["Philosophy", "Literature"]],
            ["e", "A study desk piled with notes", ["Academic/Textbook", "Mathematics"]],
            ["f", "The self-growth shelf", ["Self-help", "Non-fiction"]],
        ],
    },
    {
        id: 2,
        q: "Which subjects do you enjoy most?",
        w: 2,
        opts: [
            ["a", "Numbers and logic", ["Mathematics", "Computer Science"]],
            ["b", "Machines and building things", ["Engineering", "Science"]],
            ["c", "The past and its people", ["History", "Biography"]],
            ["d", "Life and the universe", ["Science", "Philosophy"]],
            ["e", "Language and storytelling", ["Fiction", "Literature"]],
            ["f", "The mind and habits", ["Self-help", "Philosophy"]],
        ],
    },
    {
        id: 3,
        q: "Who would you invite to dinner?",
        w: 1,
        opts: [
            ["a", "A scientist who just made a discovery", ["Science", "Mathematics"]],
            ["b", "A historian with wild stories", ["History", "Non-fiction"]],
            ["c", "A philosopher who loves to argue", ["Philosophy", "Literature"]],
            ["d", "A founder who built something big", ["Biography", "Self-help", "Non-fiction"]],
            ["e", "An inventor with a toolbox", ["Engineering", "Computer Science"]],
            ["f", "A novelist with a plot twist", ["Fiction", "Literature"]],
        ],
    },
    {
        id: 4,
        q: "A free rainy afternoon. What are you doing?",
        w: 1,
        opts: [
            ["a", "Curled up with a gripping novel", ["Fiction", "Literature"]],
            ["b", "Watching a documentary, then reading more about it", ["Non-fiction", "History", "Science"]],
            ["c", "Solving puzzles or writing code", ["Mathematics", "Computer Science"]],
            ["d", "Journaling and planning my goals", ["Self-help", "Philosophy"]],
            ["e", "Taking something apart to see how it works", ["Engineering", "Science"]],
            ["f", "Reading someone's life story", ["Biography"]],
        ],
    },
    {
        id: 5,
        q: "What do you usually read for?",
        w: 1,
        opts: [
            ["a", "Exams and coursework", ["Academic/Textbook"]],
            ["b", "Skills for my career", ["Computer Science", "Engineering", "Non-fiction"]],
            ["c", "Personal growth", ["Self-help", "Biography"]],
            ["d", "Escape and relaxation", ["Fiction"]],
            ["e", "Pure curiosity", ["Science", "History", "Philosophy", "Non-fiction"]],
        ],
    },
];

/**
 * Validates quiz answers and computes genre score weights
 * @param {Object} answers - Object with question index keys and array of option IDs, e.g. { 0: ['a'], 1: ['c'], ... }
 * @returns {{ valid: boolean, error?: string, genres: string[], scores: Object }}
 */
function evaluateQuizSubmission(answers) {
    if (!answers || typeof answers !== "object") {
        return { valid: false, error: "Quiz answers are required for registration.", genres: [] };
    }

    // Check that all 6 questions have at least one chosen option
    for (let i = 0; i < NX_QUIZ.length; i++) {
        let qAnswers = answers[i] !== undefined ? answers[i] : (answers[String(i)] !== undefined ? answers[String(i)] : answers[`q${i}`]);
        if (typeof qAnswers === "string") {
            qAnswers = [qAnswers];
        }
        if (!qAnswers || !Array.isArray(qAnswers) || qAnswers.length === 0) {
            return {
                valid: false,
                error: `Question ${i + 1} ("${NX_QUIZ[i].q}") must be answered.`,
                genres: [],
            };
        }
    }

    const scores = {};
    NX_QUIZ.forEach((Q, qi) => {
        let qAnswers = answers[qi] !== undefined ? answers[qi] : answers[String(qi)];
        if (typeof qAnswers === "string") {
            qAnswers = [qAnswers];
        }
        if (Array.isArray(qAnswers)) {
            qAnswers.forEach((optId) => {
                const opt = Q.opts.find((x) => x[0] === optId);
                if (opt && opt[2]) {
                    opt[2].forEach((genre) => {
                        scores[genre] = (scores[genre] || 0) + Q.w;
                    });
                }
            });
        }
    });

    // Rank genres by score descending, filtering for score >= 2
    const ranked = Object.keys(scores)
        .filter((g) => scores[g] >= 2)
        .sort((a, b) => scores[b] - scores[a] || NX_GENRES.indexOf(a) - NX_GENRES.indexOf(b));

    const cut = ranked.length > 5 ? scores[ranked[4]] : 0;
    const topGenres = ranked.filter((g, i) => i < 5 || scores[g] >= cut).slice(0, 7);

    // Fallback if no genre hit score >= 2
    const finalGenres = topGenres.length > 0 ? topGenres : ["Academic/Textbook", "Computer Science", "Engineering"];

    return {
        valid: true,
        genres: finalGenres,
        scores,
    };
}

module.exports = {
    NX_QUIZ,
    NX_GENRES,
    evaluateQuizSubmission,
};
