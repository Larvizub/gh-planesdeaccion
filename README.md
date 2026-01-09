# Plataforma de Planes de Acción - Grupo Heroica

![Grupo Heroica Logo](https://costaricacc.com/cccr/Logoheroica.png)

Esta aplicación ha sido diseñada para que el departamento de **Calidad** de Grupo Heroica gestione los planes de acción derivados de los comentarios de clientes, asistentes y expositores en los eventos realizados en los diferentes recintos (CCCR, CCCI, CEVP).

## 🚀 Tecnologías Utilizadas

- **Frontend**: React + TypeScript + Vite.
- **Estilos**: Tailwind CSS + Shadcn/ui.
- **Backend (BAAS)**: Firebase (Authentication, Realtime Database, Functions).
- **Integraciones**: Skill Eventos API (para la extracción automatizada de eventos).
- **Iconografía**: Lucide React.
- **Despliegue**: Firebase Hosting.

## 📋 Módulos del Sistema

1.  **Login**: Autenticación corporativa y selector de recinto (CCCR, CCCI, CEVP).
2.  **Dashboard**: Resumen visual de indicadores clave.
3.  **Eventos**: Conexión con Skill API para consultar eventos del mes, mapear estados (Confirmado/Por Confirmar) e iniciar planes de acción.
4.  **Planes de Acción**: Gestión del ciclo de vida de los planes (Abierto, En Proceso, Cerrado), registro de no conformidades y evidencias fotográficas.
5.  **Aprobaciones**: Módulo exclusivo para el equipo de Calidad para revisar, aprobar o rechazar planes propuestos por los departamentos.
6.  **Resultados**: Reportes estadísticos y gráficos optimizados para presentaciones en sala de juntas.
7.  **Configuración**: Gestión de usuarios, roles (RBAC), departamentos y tiempos límite de respuesta.

## 🛠️ Desarrollo y Configuración

### Requisitos Previos
- Node.js (v18+)
- pnpm (Gestor de paquetes recomendado)
- Firebase CLI (para despliegues)

### Instalación
1. Clonar el repositorio.
2. Instalar dependencias:
   ```bash
   pnpm install
   ```
3. Configurar variables de entorno (`.env`):
   ```env
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_DATABASE_URL=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...

   VITE_SKILL_API_URL=https://grupoheroicaapi.skillsuite.net/app/wssuite/api
   VITE_SKILL_USERNAME=...
   VITE_SKILL_PASSWORD=...
   VITE_SKILL_COMPANY_AUTH_ID=...
   ```

### Scripts Disponibles
- `pnpm dev`: Inicia el servidor de desarrollo.
- `pnpm build`: Genera la versión de producción en la carpeta `/dist`.
- `pnpm preview`: Visualiza localmente la versión de producción.

## 🌐 Despliegue

La plataforma se despliega automáticamente en Firebase Hosting.
```bash
pnpm build
firebase deploy --only hosting
```
URL de producción: [https://gh-planesdeaccion.web.app](https://gh-planesdeaccion.web.app)

## 🔐 Seguridad y Reglas
- Los accesos están restringidos por un sistema de **Roles (RBAC)** configurable desde el módulo de Configuración.
- Los datos de cada recinto están aislados en ramas independientes de la Realtime Database.
- El archivo `.gitignore` protege las credenciales de Skill API y Firebase.

---
© 2026 Grupo Heroica - Departamento de Calidad e Innovación.

