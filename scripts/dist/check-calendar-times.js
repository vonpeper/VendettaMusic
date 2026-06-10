"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
// scripts/check-calendar-times.ts
var db_1 = require("@/lib/db");
var google_calendar_1 = require("@/lib/google-calendar");
var node_fetch_1 = require("node-fetch");
/**
 * Busca eventos cuyo horario en Google Calendar difiere del registro local.
 * Imprime una tabla con id del evento, horarios locales y horarios en Calendar.
 */
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var events, config, accessToken, calendarId, _i, events_1, ev, resp, data, calStart, calEnd, localStart, localEnd;
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
        return __generator(this, function (_o) {
            switch (_o.label) {
                case 0: return [4 /*yield*/, db_1.db.event.findMany({
                        where: { googleCalendarId: { not: null } },
                        select: {
                            id: true,
                            date: true,
                            performanceStart: true,
                            performanceEnd: true,
                            startTime: true,
                            googleCalendarId: true,
                        },
                    })];
                case 1:
                    events = _o.sent();
                    return [4 /*yield*/, db_1.db.globalConfig.findUnique({ where: { id: "vendetta_config" } })];
                case 2:
                    config = _o.sent();
                    if (!(config === null || config === void 0 ? void 0 : config.googleCalendarId) || !config.googleRefreshToken) {
                        console.error("Google Calendar no está configurado.");
                        process.exit(1);
                    }
                    return [4 /*yield*/, (0, google_calendar_1.getAccessToken)()];
                case 3:
                    accessToken = _o.sent();
                    calendarId = config.googleCalendarId;
                    console.log("\nRevisando eventos...");
                    console.log("ID\tLocal Start\tLocal End\tCalendar Start\tCalendar End");
                    _i = 0, events_1 = events;
                    _o.label = 4;
                case 4:
                    if (!(_i < events_1.length)) return [3 /*break*/, 8];
                    ev = events_1[_i];
                    return [4 /*yield*/, (0, node_fetch_1.default)("https://www.googleapis.com/calendar/v3/calendars/".concat(encodeURIComponent(calendarId), "/events/").concat(ev.googleCalendarId), {
                            headers: { Authorization: "Bearer ".concat(accessToken) },
                        })];
                case 5:
                    resp = _o.sent();
                    if (!resp.ok)
                        return [3 /*break*/, 7]; // si falta el evento, lo ignoramos
                    return [4 /*yield*/, resp.json()];
                case 6:
                    data = _o.sent();
                    calStart = (_d = (_c = (_b = (_a = data.start) === null || _a === void 0 ? void 0 : _a.dateTime) === null || _b === void 0 ? void 0 : _b.split("T")[1]) === null || _c === void 0 ? void 0 : _c.slice(0, 5)) !== null && _d !== void 0 ? _d : "-";
                    calEnd = (_h = (_g = (_f = (_e = data.end) === null || _e === void 0 ? void 0 : _e.dateTime) === null || _f === void 0 ? void 0 : _f.split("T")[1]) === null || _g === void 0 ? void 0 : _g.slice(0, 5)) !== null && _h !== void 0 ? _h : "-";
                    localStart = (_k = (_j = ev.performanceStart) !== null && _j !== void 0 ? _j : ev.startTime) !== null && _k !== void 0 ? _k : "21:00";
                    localEnd = (_m = (_l = ev.performanceEnd) !== null && _l !== void 0 ? _l : ev.performanceStart) !== null && _m !== void 0 ? _m : "23:00";
                    if (calStart !== localStart || calEnd !== localEnd) {
                        console.log("".concat(ev.id, "\t").concat(localStart, "\t").concat(localEnd, "\t").concat(calStart, "\t").concat(calEnd));
                    }
                    _o.label = 7;
                case 7:
                    _i++;
                    return [3 /*break*/, 4];
                case 8: return [2 /*return*/];
            }
        });
    });
}
main().catch(function (e) { return console.error(e); });
