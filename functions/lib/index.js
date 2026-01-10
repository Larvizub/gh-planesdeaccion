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
exports.skillProxy = exports.deadlineReminder = exports.onDeadlineUpdated = exports.onPlanSubmitted = exports.onPlanCreated = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const axios_1 = __importDefault(require("axios"));
const cors_1 = __importDefault(require("cors"));
const database_1 = require("firebase-functions/v2/database");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const graph_1 = require("./graph");
const templates_1 = require("./templates");
const luxon_1 = require("luxon");
const cors = (0, cors_1.default)({ origin: true });
admin.initializeApp();
const SKILL_BASE_URL = "https://grupoheroicaapi.skillsuite.net/app/wssuite/api";
// Helper para obtener emails de usuarios filtrados
async function getUserEmails(recinto, filter) {
    const snapshot = await admin.database().ref(`users/${recinto}`).once("value");
    const users = snapshot.val();
    if (!users)
        return [];
    return Object.values(users)
        .filter((u) => u.email && (filter ? filter(u) : true))
        .map((u) => u.email);
}
// 1. Notificación: Calidad genera un plan para un departamento
exports.onPlanCreated = (0, database_1.onValueCreated)("/planes-accion/{recinto}/{planId}", async (event) => {
    const { recinto } = event.params;
    const planData = event.data.val();
    if (!planData)
        return;
    const departmentId = planData.departamentoId;
    const departmentName = planData.departamentoName || "Departamento";
    const eventoName = planData.eventoName || "Evento";
    // Buscar usuarios de ese departamento en ese recinto
    const emails = await getUserEmails(recinto, (u) => u.departmentId === departmentId);
    if (emails.length > 0) {
        const title = "Nuevo Plan de Acción Asignado";
        const content = `
      Se ha generado un nuevo plan de acción para el departamento <span class="highlight">${departmentName}</span> 
      relacionado con el evento <span class="highlight">${eventoName}</span>.<br><br>
      <p><b>Comentario:</b> ${planData.comentario}</p>
      Por favor, ingrese a la plataforma para gestionar las causas y el plan de acción correspondiente.
    `;
        const actionUrl = "https://gh-planesdeaccion.web.app/planes-accion"; // Ajustar si es necesario
        await (0, graph_1.sendEmail)(emails, `Nuevo Plan de Acción: ${eventoName}`, (0, templates_1.getEmailTemplate)(title, content, "Ver Planes de Acción", actionUrl));
    }
});
// 2. Notificación: Usuario envía plan a aprobación
exports.onPlanSubmitted = (0, database_1.onValueWritten)("/planes-accion/{recinto}/{planId}", async (event) => {
    const { recinto } = event.params;
    const beforeData = event.data.before.val();
    const afterData = event.data.after.val();
    if (!afterData)
        return; // Deletion
    // Solo si 'gestionado' cambió de false a true
    if (beforeData?.gestionado === false && afterData?.gestionado === true) {
        const departmentName = afterData.departamentoName || "Un departamento";
        const eventoName = afterData.eventoName || "Evento";
        // Buscar usuarios de Calidad/Administrador
        const emails = await getUserEmails(recinto, (u) => u.role === 'Calidad' || u.role === 'Administrador');
        if (emails.length > 0) {
            const title = "Plan de Acción Enviado para Revisión";
            const content = `
        El departamento <span class="highlight">${departmentName}</span> ha completado y enviado 
        a aprobación un plan de acción para el evento <span class="highlight">${eventoName}</span>.<br><br>
        Por favor, revise y apruebe o rechace la gestión realizada.
      `;
            const actionUrl = "https://gh-planesdeaccion.web.app/aprobaciones";
            await (0, graph_1.sendEmail)(emails, `Aprobación Pendiente: ${eventoName}`, (0, templates_1.getEmailTemplate)(title, content, "Ir a Aprobaciones", actionUrl));
        }
    }
});
// 3. Notificación: Cambio en fecha límite (Tiempos Límites)
exports.onDeadlineUpdated = (0, database_1.onValueWritten)("/config/{recinto}/tiempos/fechaLimite", async (event) => {
    const { recinto } = event.params;
    const newDate = event.data.after.val();
    if (!newDate)
        return;
    // Buscar todos los usuarios del recinto
    const emails = await getUserEmails(recinto);
    if (emails.length > 0) {
        const formattedDate = luxon_1.DateTime.fromISO(newDate).setLocale('es').toLocaleString(luxon_1.DateTime.DATETIME_MED);
        const title = "Actualización de Tiempo Límite";
        const content = `
      Se ha establecido una nueva fecha y hora límite para el registro y gestión de planes de acción en <span class="highlight">${recinto}</span>.<br><br>
      Nueva fecha límite: <span class="highlight">${formattedDate}</span><br><br>
      Asegúrese de completar sus planes pendientes antes de esta fecha.
    `;
        const actionUrl = "https://gh-planesdeaccion.web.app/";
        await (0, graph_1.sendEmail)(emails, `Nueva Fecha Límite: ${recinto}`, (0, templates_1.getEmailTemplate)(title, content, "Ir a la Plataforma", actionUrl));
    }
});
// 4. Recordatorio un día antes del cierre (Lunes a Viernes, 08:00 - 17:00 CST)
// Programado para revisar cada hora durante el horario laboral
exports.deadlineReminder = (0, scheduler_1.onSchedule)({
    schedule: "0 8-17 * * 1-5",
    timeZone: "America/Mexico_City",
}, async (event) => {
    const recintos = ["CCCR", "CCCI", "CEVP"];
    const now = luxon_1.DateTime.now().setZone("America/Mexico_City");
    for (const recinto of recintos) {
        try {
            const snapshot = await admin.database().ref(`config/${recinto}/tiempos/fechaLimite`).once("value");
            const fechaLimiteStr = snapshot.val();
            if (!fechaLimiteStr)
                continue;
            const fechaLimite = luxon_1.DateTime.fromISO(fechaLimiteStr).setZone("America/Mexico_City");
            const diff = fechaLimite.diff(now, 'hours').hours;
            // Si falta entre 23 y 24 horas (es decir, estamos a "un día antes" en horario laboral)
            // O ajustamos a un rango para que dispare una vez.
            // Para evitar duplicados en la misma ventana de "un día antes", podemos guardar un flag o ser precisos.
            if (diff > 23 && diff <= 24) {
                const emails = await getUserEmails(recinto);
                if (emails.length > 0) {
                    const formattedDate = fechaLimite.setLocale('es').toLocaleString(luxon_1.DateTime.DATETIME_MED);
                    const title = "Recordatorio: Cierre Próximo";
                    const content = `
            Este es un recordatorio de que el tiempo límite para la gestión de planes de acción en <span class="highlight">${recinto}</span> 
            finaliza en <span class="highlight">24 horas</span>.<br><br>
            Fecha de cierre: <span class="highlight">${formattedDate}</span><br><br>
            Por favor, asegúrese de gestionar todos sus planes abiertos.
          `;
                    await (0, graph_1.sendEmail)(emails, `Recordatorio 24h: Cierre de Planes ${recinto}`, (0, templates_1.getEmailTemplate)(title, content, "Ir a la Plataforma", "https://gh-planesdeaccion.web.app/"));
                }
            }
        }
        catch (error) {
            console.error(`Error procesando recordatorio para ${recinto}:`, error);
        }
    }
});
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