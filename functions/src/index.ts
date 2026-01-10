import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import axios, { AxiosRequestConfig, Method } from "axios";
import corsLib from "cors";
import { onValueWritten, onValueCreated } from "firebase-functions/v2/database";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { sendEmail } from "./graph";
import { getEmailTemplate } from "./templates";
import { DateTime } from "luxon";

const cors = corsLib({ origin: true });

admin.initializeApp();

const SKILL_BASE_URL = "https://grupoheroicaapi.skillsuite.net/app/wssuite/api";

// Helper para obtener emails de usuarios filtrados
async function getUserEmails(recinto: string, filter?: (user: any) => boolean) {
  const snapshot = await admin.database().ref(`users/${recinto}`).once("value");
  const users = snapshot.val();
  if (!users) return [];
  
  return Object.values(users)
    .filter((u: any) => u.email && (filter ? filter(u) : true))
    .map((u: any) => u.email);
}

// 1. Notificación: Calidad genera un plan para un departamento
export const onPlanCreated = onValueCreated("/planes-accion/{recinto}/{planId}", async (event) => {
  const { recinto } = event.params;
  const planData = event.data.val();
  
  if (!planData) return;

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
    
    await sendEmail(emails, `Nuevo Plan de Acción: ${eventoName}`, getEmailTemplate(title, content, "Ver Planes de Acción", actionUrl));
  }
});

// 2. Notificación: Usuario envía plan a aprobación
export const onPlanSubmitted = onValueWritten("/planes-accion/{recinto}/{planId}", async (event) => {
  const { recinto } = event.params;
  const beforeData = event.data.before.val();
  const afterData = event.data.after.val();

  if (!afterData) return; // Deletion

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
      
      await sendEmail(emails, `Aprobación Pendiente: ${eventoName}`, getEmailTemplate(title, content, "Ir a Aprobaciones", actionUrl));
    }
  }
});

// 3. Notificación: Cambio en fecha límite (Tiempos Límites)
export const onDeadlineUpdated = onValueWritten("/config/{recinto}/tiempos/fechaLimite", async (event) => {
  const { recinto } = event.params;
  const newDate = event.data.after.val();

  if (!newDate) return;

  // Buscar todos los usuarios del recinto
  const emails = await getUserEmails(recinto);

  if (emails.length > 0) {
    const formattedDate = DateTime.fromISO(newDate).setLocale('es').toLocaleString(DateTime.DATETIME_MED);
    const title = "Actualización de Tiempo Límite";
    const content = `
      Se ha establecido una nueva fecha y hora límite para el registro y gestión de planes de acción en <span class="highlight">${recinto}</span>.<br><br>
      Nueva fecha límite: <span class="highlight">${formattedDate}</span><br><br>
      Asegúrese de completar sus planes pendientes antes de esta fecha.
    `;
    const actionUrl = "https://gh-planesdeaccion.web.app/";
    
    await sendEmail(emails, `Nueva Fecha Límite: ${recinto}`, getEmailTemplate(title, content, "Ir a la Plataforma", actionUrl));
  }
});

// 4. Recordatorio un día antes del cierre (Lunes a Viernes, 08:00 - 17:00 CST)
// Programado para revisar cada hora durante el horario laboral
export const deadlineReminder = onSchedule({
  schedule: "0 8-17 * * 1-5",
  timeZone: "America/Mexico_City",
}, async (event) => {
  const recintos = ["CCCR", "CCCI", "CEVP"];
  const now = DateTime.now().setZone("America/Mexico_City");

  for (const recinto of recintos) {
    try {
      const snapshot = await admin.database().ref(`config/${recinto}/tiempos/fechaLimite`).once("value");
      const fechaLimiteStr = snapshot.val();
      
      if (!fechaLimiteStr) continue;

      const fechaLimite = DateTime.fromISO(fechaLimiteStr).setZone("America/Mexico_City");
      const diff = fechaLimite.diff(now, 'hours').hours;

      // Si falta entre 23 y 24 horas (es decir, estamos a "un día antes" en horario laboral)
      // O ajustamos a un rango para que dispare una vez.
      // Para evitar duplicados en la misma ventana de "un día antes", podemos guardar un flag o ser precisos.
      if (diff > 23 && diff <= 24) {
        const emails = await getUserEmails(recinto);
        if (emails.length > 0) {
          const formattedDate = fechaLimite.setLocale('es').toLocaleString(DateTime.DATETIME_MED);
          const title = "Recordatorio: Cierre Próximo";
          const content = `
            Este es un recordatorio de que el tiempo límite para la gestión de planes de acción en <span class="highlight">${recinto}</span> 
            finaliza en <span class="highlight">24 horas</span>.<br><br>
            Fecha de cierre: <span class="highlight">${formattedDate}</span><br><br>
            Por favor, asegúrese de gestionar todos sus planes abiertos.
          `;
          await sendEmail(emails, `Recordatorio 24h: Cierre de Planes ${recinto}`, getEmailTemplate(title, content, "Ir a la Plataforma", "https://gh-planesdeaccion.web.app/"));
        }
      }
    } catch (error) {
      console.error(`Error procesando recordatorio para ${recinto}:`, error);
    }
  }
});

export const skillProxy = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    const fullPath = req.url || "";
    const cleanPath = fullPath.replace(/^\/api-skill/, "");

    try {
      const url = `${SKILL_BASE_URL}${cleanPath}`;
      console.log(`Proxying ${req.method} to: ${url}`);

      const config: AxiosRequestConfig = {
        method: req.method as Method,
        url: url,
        data: req.body,
        headers: {
          "Content-Type": "application/json",
          "idData": (req.headers["iddata"] as string) || "",
          "companyAuthId": (req.headers["companyauthid"] as string) || "",
          "Authorization": (req.headers["authorization"] as string) || "",
        },
      };

      const response = await axios(config);
      res.status(200).json(response.data);
    } catch (error: any) {
      console.error("Proxy Error:", error.response?.data || error.message);
      const status = error.response?.status || 500;
      const errorData = error.response?.data || { errorMessage: error.message };
      res.status(status).json(errorData);
    }
  });
});
