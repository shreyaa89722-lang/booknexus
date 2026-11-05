const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");

let mongodInstance = null;

const connectDB = async () => {
  const uri = process.env.ATLAS_MONGO_URI || process.env.MONGO_URI;
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

    // Check if an active local instance URI was already saved
    const uriFile = path.join(__dirname, ".active_mongo_uri");
    if (fs.existsSync(uriFile)) {
      try {
        const savedUri = fs.readFileSync(uriFile, "utf8").trim();
        if (savedUri) {
          await mongoose.connect(savedUri, { serverSelectionTimeoutMS: 2000 });
          console.log(`✅ MongoDB connected to existing local instance at ${savedUri}`);
          return;
        }
      } catch (err) {
        // Saved URI instance no longer reachable, proceed to start new instance
      }
    }

    // Try connecting to standard 27017 local mongo instance first
    try {
      await mongoose.connect("mongodb://127.0.0.1:27017/bookhive", {
        serverSelectionTimeoutMS: 2000,
      });
      console.log(`✅ MongoDB connected to existing local instance at 127.0.0.1:27017/bookhive`);
      fs.writeFileSync(uriFile, "mongodb://127.0.0.1:27017/bookhive", "utf8");
      return;
    } catch (e) {
      // No instance running on 27017 yet, spin one up
    }

    const { MongoMemoryServer } = require("mongodb-memory-server");
    try {
      mongodInstance = await MongoMemoryServer.create({
        instance: {
          port: 27017,
          dbPath: dataDir,
          storageEngine: "wiredTiger",
        },
      });
    } catch (memErr) {
      console.warn(`⚠️ Port 27017 unavailable (${memErr.message}). Spawning with dynamic port...`);
      mongodInstance = await MongoMemoryServer.create({
        instance: {
          dbPath: dataDir,
          storageEngine: "wiredTiger",
        },
      });
    }

    let localUri = mongodInstance.getUri();
    if (!localUri.endsWith("/")) localUri += "/";
    localUri += "bookhive";
    await mongoose.connect(localUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB connected to local persistent database: ${localUri}`);
    fs.writeFileSync(uriFile, localUri, "utf8");

  } catch (error) {
    console.error(`❌ Local MongoDB connection error: ${error.message}`);
  }
};

// Graceful cleanup
process.on("SIGINT", async () => {
  await mongoose.disconnect();
  if (mongodInstance) {
    await mongodInstance.stop();
  }
  process.exit(0);
});

module.exports = connectDB;
