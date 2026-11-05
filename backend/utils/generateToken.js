const jwt = require("jsonwebtoken");

const generateToken = (id, role) => {
  let userId;
  let userRole = role;

  if (id && typeof id === "object" && id.constructor && id.constructor.name === "ObjectId") {
    userId = String(id);
  } else if (id && typeof id === "object" && id.id) {
    userId = String(id.id);
    if (!userRole && id.role) userRole = id.role;
  } else {
    userId = String(id);
  }

  const payload = {
    id: userId,
    ...(userRole ? { role: userRole } : {}),
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

module.exports = generateToken;
