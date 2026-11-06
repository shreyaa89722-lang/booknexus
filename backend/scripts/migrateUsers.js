const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

async function migrate() {
    const mongoUri = process.env.ATLAS_MONGO_URI || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/bookhive";
    console.log("Connecting to MongoDB:", mongoUri);
    await mongoose.connect(mongoUri);

    const User = require("../models/user");

    // 1. Clean empty strings for usn so sparse unique index succeeds
    const emptyUsnRes = await User.collection.updateMany(
        { usn: "" },
        { $unset: { usn: "" } }
    );
    console.log(`Cleaned empty string USNs: ${emptyUsnRes.modifiedCount}`);

    // 2. Mark existing registered users as completed
    const existingUsersRes = await User.collection.updateMany(
        {
            $or: [
                { usn: { $exists: true, $ne: null } },
                { role: "admin" },
                { password: { $exists: true, $ne: null } },
            ],
            registrationCompleted: { $in: [null, false] },
        },
        {
            $set: {
                registrationCompleted: true,
                quizCompleted: true,
                onboardingStep: "completed",
            },
        }
    );
    console.log(`Marked existing users as registrationCompleted: ${existingUsersRes.modifiedCount}`);

    // 3. Build unique sparse index on USN
    try {
        await User.collection.createIndex({ usn: 1 }, { unique: true, sparse: true });
        console.log("✓ Successfully created unique sparse index on usn");
    } catch (idxErr) {
        console.warn("Index notice:", idxErr.message);
    }

    // 4. Verify indexes
    const indexes = await User.collection.indexes();
    console.log("Current user collection indexes:", indexes.map(i => ({ name: i.name, key: i.key, unique: i.unique })));

    const count = await User.countDocuments();
    const completedCount = await User.countDocuments({ registrationCompleted: true });
    console.log(`Total users in DB: ${count} | Completed registration: ${completedCount}`);

    await mongoose.disconnect();
    console.log("Migration complete.");
}

migrate().catch(e => {
    console.error("Migration error:", e);
    process.exit(1);
});

