const auth = require("./authMiddleware");
const role = require("./roleMiddleware");
const err = require("./errorMiddleware");
const val = require("./validators");

module.exports = {
    ...auth,
    ...role,
    ...err,
    ...val,
    authMiddleware: auth,
    authmiddleware: auth,
    roleMiddleware: role,
    rolemiddleware: role,
    errorMiddleware: err,
    errormiddleware: err,
    validators: val,
};

