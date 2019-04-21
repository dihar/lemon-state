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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var is_plain_object_1 = __importDefault(require("is-plain-object"));
var setStateWithShallowCheck_1 = __importDefault(require("./setStateWithShallowCheck"));
/**
 * Simple store class with minimum functions
 */
var SimpleStore = /** @class */ (function () {
    function SimpleStore(initialState) {
        var _this = this;
        if (initialState === void 0) { initialState = {}; }
        this.getState = function () {
            return _this.state;
        };
        this.subscribe = function (fn) {
            _this.subscribers.push(fn);
            return function () {
                _this.subscribers = _this.subscribers.filter(function (sub) { return sub !== fn; });
            };
        };
        this.setState = function (diff) {
            if (!is_plain_object_1.default(diff)) {
                throw new TypeError('new state must be plain Object');
            }
            var newState = setStateWithShallowCheck_1.default(diff, _this.state);
            if (!Object.is(newState, _this.state)) {
                _this.state = newState;
                _this.subscribers.forEach(function (sub) { return sub(newState); });
            }
        };
        if (!is_plain_object_1.default(initialState)) {
            throw new TypeError('initialState must be plain Object');
        }
        this.state = initialState ? __assign({}, initialState) : {};
        this.subscribers = [];
    }
    return SimpleStore;
}());
exports.default = SimpleStore;
