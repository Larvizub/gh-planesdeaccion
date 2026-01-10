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
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = sendEmail;
const msal = __importStar(require("@azure/msal-node"));
const microsoft_graph_client_1 = require("@microsoft/microsoft-graph-client");
require("isomorphic-fetch");
const params_1 = require("firebase-functions/params");
// Definición de secretos de Firebase
const MS_CLIENT_ID = (0, params_1.defineSecret)("MICROSOFT_CLIENT_ID");
const MS_CLIENT_SECRET = (0, params_1.defineSecret)("MICROSOFT_CLIENT_SECRET");
const MS_TENANT_ID = (0, params_1.defineSecret)("MICROSOFT_TENANT_ID");
const MS_SENDER_EMAIL = (0, params_1.defineSecret)("MICROSOFT_SENDER_EMAIL");
let clientInstance = null;
async function getGraphClient() {
    if (clientInstance)
        return clientInstance;
    const msalConfig = {
        auth: {
            clientId: MS_CLIENT_ID.value(),
            authority: `https://login.microsoftonline.com/${MS_TENANT_ID.value()}`,
            clientSecret: MS_CLIENT_SECRET.value(),
        },
    };
    const cca = new msal.ConfidentialClientApplication(msalConfig);
    const tokenResponse = await cca.acquireTokenByClientCredential({
        scopes: ["https://graph.microsoft.com/.default"],
    });
    if (!tokenResponse) {
        throw new Error("Could not acquire access token for Microsoft Graph");
    }
    clientInstance = microsoft_graph_client_1.Client.init({
        authProvider: (done) => {
            done(null, tokenResponse.accessToken);
        },
    });
    return clientInstance;
}
async function sendEmail(to, subject, htmlContent) {
    try {
        const client = await getGraphClient();
        const sender = MS_SENDER_EMAIL.value();
        const email = {
            message: {
                subject: subject,
                body: {
                    contentType: "Html",
                    content: htmlContent,
                },
                toRecipients: to.map(email => ({
                    emailAddress: {
                        address: email,
                    },
                })),
            },
            saveToSentItems: "false",
        };
        await client.api(`/users/${sender}/sendMail`).post(email);
        console.log(`Email sent successfully to ${to.join(", ")}`);
    }
    catch (error) {
        console.error("Error sending email via Microsoft Graph:", error);
        throw error;
    }
}
//# sourceMappingURL=graph.js.map