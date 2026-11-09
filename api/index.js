const path = require('path');
const backendNodeModules = path.resolve(__dirname, '../backend/node_modules');
if (!module.paths.includes(backendNodeModules)) {
  module.paths.push(backendNodeModules);
}
require('../backend/config/linuxCaseResolver');
let dotenv;
try {
  dotenv = require('dotenv');
} catch (e) {
  dotenv = require(path.join(backendNodeModules, 'dotenv'));
}

dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });

const { app, connectDB } = require('../backend/server');

let isConnected = false;
let connectPromise = null;

module.exports = async (req, res) => {
  if (!isConnected) {
    if (!connectPromise) {
      connectPromise = connectDB().then(() => {
        isConnected = true;
      }).catch(err => {
        console.error('MongoDB connection error in Vercel function:', err.message);
      });
    }
    await connectPromise;
  }
  return app(req, res);
};
