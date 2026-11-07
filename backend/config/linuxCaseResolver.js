/**
 * Linux Case Sensitivity Resolver
 * Ensures zero MODULE_NOT_FOUND errors on Linux production servers (Render/Ubuntu)
 * by intercepting case mismatches in relative require paths.
 */
const Module = require("module");
const fs = require("fs");
const path = require("path");

const origResolve = Module._resolveFilename;

function findCaseInsensitive(startDir, parts) {
    let curr = startDir;
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (part === "." || part === "") continue;
        if (part === "..") {
            curr = path.dirname(curr);
            continue;
        }
        if (!fs.existsSync(curr) || !fs.statSync(curr).isDirectory()) return null;
        const entries = fs.readdirSync(curr);
        const partLower = part.toLowerCase();
        const match = entries.find((e) => {
            const el = e.toLowerCase();
            return (
                el === partLower ||
                (i === parts.length - 1 &&
                    (el === partLower + ".js" || el === partLower + ".json"))
            );
        });
        if (!match) return null;
        curr = path.join(curr, match);
    }
    return curr;
}

Module._resolveFilename = function (request, parent, isMain, options) {
    try {
        return origResolve.call(this, request, parent, isMain, options);
    } catch (err) {
        if (
            err.code === "MODULE_NOT_FOUND" &&
            (request.startsWith("./") || request.startsWith("../"))
        ) {
            const fromDir =
                parent && parent.filename
                    ? path.dirname(parent.filename)
                    : process.cwd();
            const parts = request.split(/[\\/]/);
            const match = findCaseInsensitive(fromDir, parts);
            if (match) {
                return origResolve.call(this, match, parent, isMain, options);
            }
        }
        throw err;
    }
};

module.exports = { findCaseInsensitive };
