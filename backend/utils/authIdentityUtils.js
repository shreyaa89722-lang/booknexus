/**
 * BookNexus Student Identity & Normalization Utilities
 * Handles secure normalization, date of birth validation, and comparison for student accounts.
 */

// 1. Full Name Normalization
function normalizeNameForComparison(name) {
    if (!name) return "";
    return String(name)
        .toLowerCase()
        .replace(/[\.\,\-\'\"\_]/g, "")
        .replace(/\s+/g, "")
        .trim();
}

function compareNames(name1, name2) {
    if (!name1 || !name2) return false;
    return normalizeNameForComparison(name1) === normalizeNameForComparison(name2);
}

function sanitizeDisplayName(name) {
    if (!name) return "";
    return String(name).trim().replace(/\s+/g, " ");
}

// 2. USN Normalization
function normalizeUsn(usn) {
    if (!usn) return undefined;
    const cleaned = String(usn).trim().replace(/\s+/g, "").toUpperCase();
    return cleaned.length > 0 ? cleaned : undefined;
}

// 3. Date of Birth Validation & Normalization
function validateAndFormatDate(year, month, day) {
    const currentYear = new Date().getFullYear();
    if (year < 1920 || year > currentYear) return null;
    if (month < 1 || month > 12) return null;
    if (day < 1 || day > 31) return null;

    const dateObj = new Date(Date.UTC(year, month - 1, day));
    if (
        dateObj.getUTCFullYear() !== year ||
        dateObj.getUTCMonth() !== month - 1 ||
        dateObj.getUTCDate() !== day
    ) {
        return null; // Invalid day for month (e.g., Feb 30)
    }

    const today = new Date();
    // Reject future dates
    if (dateObj > today) return null;

    // Student must be at least 10 years old
    const minAgeDate = new Date();
    minAgeDate.setFullYear(minAgeDate.getFullYear() - 10);
    if (dateObj > minAgeDate) return null;

    const mm = String(month).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    return `${year}-${mm}-${dd}`;
}

function normalizeDob(dobStr) {
    if (!dobStr) return null;
    const str = String(dobStr).trim();

    // Match YYYY-MM-DD or YYYY/MM/DD
    const isoMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
    if (isoMatch) {
        return validateAndFormatDate(
            parseInt(isoMatch[1], 10),
            parseInt(isoMatch[2], 10),
            parseInt(isoMatch[3], 10)
        );
    }

    // Match DD-MM-YYYY or DD/MM/YYYY
    const dmyMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
    if (dmyMatch) {
        return validateAndFormatDate(
            parseInt(dmyMatch[3], 10),
            parseInt(dmyMatch[2], 10),
            parseInt(dmyMatch[1], 10)
        );
    }

    // Fallback: Date parse
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
        return validateAndFormatDate(
            parsed.getUTCFullYear(),
            parsed.getUTCMonth() + 1,
            parsed.getUTCDate()
        );
    }

    return null;
}

function compareDobs(dob1, dob2) {
    const n1 = normalizeDob(dob1);
    const n2 = normalizeDob(dob2);
    if (!n1 || !n2) return false;
    return n1 === n2;
}

module.exports = {
    normalizeNameForComparison,
    compareNames,
    sanitizeDisplayName,
    normalizeUsn,
    validateAndFormatDate,
    normalizeDob,
    compareDobs,
};
