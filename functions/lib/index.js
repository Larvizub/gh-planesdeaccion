"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.skillProxy = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const axios_1 = __importDefault(require("axios"));
const cors_1 = __importDefault(require("cors"));
const cors = (0, cors_1.default)({ origin: true });
admin.initializeApp();
const SKILL_BASE_URL = "https://grupoheroicaapi.skillsuite.net/app/wssuite/api";
exports.skillProxy = functions.https.onRequest((req, res) => {
    return cors(req, res, async () => {
        const fullPath = req.url || "";
        const cleanPath = fullPath.replace(/^\/api-skill/, "");
        try {
            const url = `${SKILL_BASE_URL}${cleanPath}`;
            console.log(`Proxying ${req.method} to: ${url}`);
            const config = {
                method: req.method,
                url: url,
                data: req.body,
                headers: {
                    "Content-Type": "application/json",
                    "idData": req.headers["iddata"] || "",
                    "companyAuthId": req.headers["companyauthid"] || "",
                    "Authorization": req.headers["authorization"] || "",
                },
            };
            const response = await (0, axios_1.default)(config);
            res.status(200).json(response.data);
        }
        catch (error) {
            console.error("Proxy Error:", error.response?.data || error.message);
            const status = error.response?.status || 500;
            const errorData = error.response?.data || { errorMessage: error.message };
            res.status(status).json(errorData);
        }
    });
});
//# sourceMappingURL=index.js.map