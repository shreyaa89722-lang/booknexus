const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");

let mongodInstance = null;

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  const isAtlas = uri && uri.startsWith("mongodb") && !uri.includes("127.0.0.1") && !uri.includes("localhost");

  if (isAtlas) {
    try {
      console.log("Connecting to Atlas MongoDB...");
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 4000,
      });
      console.log(`✅ MongoDB connected to Atlas: ${conn.connection.host}`);
      return;
    } catch (err) {
      console.warn(`⚠️ Atlas connection failed (${err.message}). Falling back to local persistent MongoDB...`);
    }
  }

  // Connect to local MongoDB
  try {
    const dataDir = path.join(__dirname, "../data/db");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Try connecting to existing local mongo instance first
    try {
      const conn = await mongoose.connect("mongodb://127.0.0.1:27017/bookhive", {
        serverSelectionTimeoutMS: 2000,
      });
      console.log(`✅ MongoDB connected to existing local instance at 127.0.0.1:27017/bookhive`);
      return;
    } catch (e) {
      // No instance running yet, spin one up
    }

    const { MongoMemoryServer } = require("mongodb-memory-server");
    mongodInstance = await MongoMemoryServer.create({
      instance: {
        port: 27017,
        dbPath: dataDir,
        storageEngine: "wiredTiger",
      },
    });

    const localUri = mongodInstance.getUri() + "bookhive";
    const conn = await mongoose.connect(localUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB connected to local persistent database: ${localUri}`);

  } catch (error) {
    console.error(`❌ Local MongoDB connection error: ${error.message}`);
  }
};

// Graceful cleanup
process.on("SIGINT", async () => {
  await mongoose.disconnect();
  if (mongodInstance) await mongodInstance.stop();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await mongoose.disconnect();
  if (mongodInstance) await mongodInstance.stop();
  process.exit(0);
});

module.exports = connectDB;