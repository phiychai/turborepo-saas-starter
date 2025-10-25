"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.omit = exports.unique = exports.chunk = exports.createPaginatedResponse = exports.createErrorResponse = exports.createApiResponse = exports.slugify = exports.truncateText = exports.getRelativeTime = exports.formatDate = exports.isValidUUID = exports.isValidEmail = void 0;
// Validation utilities
var isValidEmail = function (email) {
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
exports.isValidEmail = isValidEmail;
var isValidUUID = function (uuid) {
    var uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
};
exports.isValidUUID = isValidUUID;
// Date utilities
var formatDate = function (date) {
    return date.toISOString();
};
exports.formatDate = formatDate;
var getRelativeTime = function (date) {
    var now = new Date();
    var diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffInSeconds < 60)
        return 'just now';
    if (diffInSeconds < 3600)
        return "".concat(Math.floor(diffInSeconds / 60), "m ago");
    if (diffInSeconds < 86400)
        return "".concat(Math.floor(diffInSeconds / 3600), "h ago");
    if (diffInSeconds < 2592000)
        return "".concat(Math.floor(diffInSeconds / 86400), "d ago");
    return date.toLocaleDateString();
};
exports.getRelativeTime = getRelativeTime;
// String utilities
var truncateText = function (text, maxLength) {
    if (text.length <= maxLength)
        return text;
    return text.substring(0, maxLength) + '...';
};
exports.truncateText = truncateText;
var slugify = function (text) {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
};
exports.slugify = slugify;
// API utilities
var createApiResponse = function (data, success, message) {
    if (success === void 0) { success = true; }
    return {
        success: success,
        data: data,
        message: message
    };
};
exports.createApiResponse = createApiResponse;
var createErrorResponse = function (error) {
    return {
        success: false,
        error: error
    };
};
exports.createErrorResponse = createErrorResponse;
var createPaginatedResponse = function (data, total, page, limit) {
    return {
        data: data,
        total: total,
        page: page,
        limit: limit,
        totalPages: Math.ceil(total / limit)
    };
};
exports.createPaginatedResponse = createPaginatedResponse;
// Array utilities
var chunk = function (array, size) {
    var chunks = [];
    for (var i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
};
exports.chunk = chunk;
var unique = function (array) {
    return __spreadArray([], new Set(array), true);
};
exports.unique = unique;
// Object utilities
// export const pick = <T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> => {
//   const result = {} as Pick<T, K>;
//   keys.forEach(key => {
//     if (key in obj) {
//       result[key] = obj[key];
//     }
//   });
//   return result;
// };
var omit = function (obj, keys) {
    var result = __assign({}, obj);
    keys.forEach(function (key) {
        delete result[key];
    });
    return result;
};
exports.omit = omit;
