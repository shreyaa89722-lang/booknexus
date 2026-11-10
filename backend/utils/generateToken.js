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

  const secret = process.env.JWT_SECRET || "booknexus_jwt_production_secret_key_2026_secured";
  return jwt.sign(payload, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

module.exports = generateToken;
