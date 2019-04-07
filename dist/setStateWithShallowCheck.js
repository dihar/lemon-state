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
Object.defineProperty(exports, "__esModule", { value: true });
var setStateWithShallowCheck = function (newState, state) {
    if (state === void 0) { state = {}; }
    if (Object.is(newState, state)) {
        return newState;
    }
    var newStateEntries = Object.entries(newState);
    var isObjectsEquals = !newStateEntries.some(function (_a) {
        var key = _a[0], value = _a[1];
        return !Object.is(value, state[key]);
    });
    return isObjectsEquals ? state : __assign({}, state, newState);
};
exports.default = setStateWithShallowCheck;
