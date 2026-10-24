// Escapes user input before using it inside a MongoDB $regex (prevents regex injection)
const escapeRegex = (text = '') => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Case-insensitive "contains" regex for search boxes
const containsRegex = (text) => new RegExp(escapeRegex(String(text).trim()), 'i');

module.exports = { escapeRegex, containsRegex };
