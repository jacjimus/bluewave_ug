"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalSearch = exports.isValidEmail = exports.getRandomInt = exports.isValidKenyanPhoneNumber = void 0;
function isValidKenyanPhoneNumber(phoneNumber) {
    const kenyanPhoneNumberRegex = /^(\+?254|0)[17]\d{8}$/;
    return kenyanPhoneNumberRegex.test(phoneNumber);
}
exports.isValidKenyanPhoneNumber = isValidKenyanPhoneNumber;
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
exports.getRandomInt = getRandomInt;
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
exports.isValidEmail = isValidEmail;
function globalSearch(array, searchTerm) {
    console.log("SEARCH TERM", searchTerm);
    console.log("ARRAY", array.length);
    // Convert the searchTerm to lowercase for case-insensitive search
    const search = searchTerm.toLowerCase();
    // Use the filter() method to find objects matching the search term
    const results = array.filter((item) => {
        var _a, _b;
        // Spread all object fields into the ITEM
        const ITEM = Object.assign(Object.assign(Object.assign({}, item.dataValues), (_a = item === null || item === void 0 ? void 0 : item.user) === null || _a === void 0 ? void 0 : _a.dataValues), (_b = item === null || item === void 0 ? void 0 : item.policy) === null || _b === void 0 ? void 0 : _b.dataValues);
        console.log("ITEM", ITEM);
        // Combine all object values into a single string for searching
        const objectValues = Object.values(ITEM).join(' ').toLowerCase();
        return objectValues.includes(search);
    });
    return results;
}
exports.globalSearch = globalSearch;
