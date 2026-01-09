---
applyTo: '**'
---

# Instrucciones base para la aplicación de los planes de acción

Utiliza siempre pnpm como gestor de paquetes.
Utiliza Vite como herramienta de construcción con React y TypeScript.
Utiliza ESLint y Prettier para el formateo y la calidad del código.
Configura ESLint con las reglas recomendadas para TypeScript y React.
Configura Prettier para que sea compatible con ESLint.
Siempre revisa que no queden errores de código antes de hacer un commit, push o deploy.
Los estilos deben ser con Shadcn/ui y Tailwind CSS. 
El logo de la aplicación debe ser el siguiente: https://costaricacc.com/cccr/Logoheroica.png
La aplicación debe ser responsive y funcionar correctamente en dispositivos móviles y de escritorio.
Debe ser compatible con modo oscuro y claro y alternar entre ambos según la configuración del navegador.

La aplicación debe utilizar Firebase como BAAS y debe utilizar lo siguiente: 
- Autenticación con correo electrónico con microsoft graph 
- Real-time database como base de datos principal
- Functions para la lógica del lado del servidor en algunos servicios específicos

La aplicación debe conectarse con el API de Skill Eventos y extraer los eventos Para esto puedes revisar la documentación en: 

https://skill4it.atlassian.net/wiki/spaces/apidoc/pages/2057437200/Por+Token
https://skill4it.atlassian.net/wiki/spaces/apidoc/pages/2059108353/MakeRoomCharge
https://skill4it.atlassian.net/wiki/spaces/apidoc/pages/2204532737/GetEvents

Los credenciales para conectarse al API de Skill Eventos son los siguientes:

URL Webservice: https://grupoheroicaapi.skillsuite.net/app/wssuite/api
username:  wsSk4Api
password: 5qT2Uu!qIjG%$XeD
companyAuthId: xudQREZBrfGdw0ag8tE3NR3XhM6LGa
CCCR(Costa de Rica) idData = 14
 

# Instrucciones de como debe ser la Aplicación

objetivo de la aplicación: La aplicación deberá permitir al departamento de Calidad gestionar los planes de accción deribados de los comentarios de los clientes, asistentes y expositores de los eventos organizados por el Recinto seleccionado desde la página de login y poder hacer seguimiento de los mismos hasta su cierre.

La aplicación debe constar de los siguientes secciones: 
- Login: Pantalla de inicio de sesión con autenticación mediante correo electrónico con Microsoft Graph y un selector de la base de datos en realtime database del recinto. Los recintos son (CCCR, CCCI y CEVP)
- Dashboard: Pantalla principal que muestra un resumen de la información relevante.
- Eventos: En esta sección se cargaran los eventos del mes, Este es el único modulo que se conectará con Skill para extraer los eventos del mes actual, luego se debe poder seleccionar un evento y poder generar comentarios y planes de acción asociados a ese evento y estos a su vez asociados a un departamento, el cual se conectará con el modulo de departamentos de en el modulo de configuración, Al seleccionar un departamento se debe asignar el plan de acción al usuario responsable de ese departamento.
- Planes de Acción: En esta sección el usuario podrá ver todos las solicitudes para generar el plan de acción basado en los comentarios generados en el modulo de eventos, podrá ver el estado de cada plan de acción (Abierto, En Proceso, Cerrado) y podrá actualizar el estado del plan de acción, agregar comentarios adicionales y cerrar el plan de acción cuando se haya completado. Se debe poder agregar un registro para un consecutivo de No conformidad en caso de que el comentario haya hecho que se levantara una no conformidad. Si el plan de accción está cerrado la aplicación debe afrecer la posibilidad de subir pruebas fotograficas del cierre del plan de acción.
- Aprobaciones: En esta sección los usuarios con el rol de Calidad podrán ver los planes de acción de los departamentos y este usuario deberá aprobar o rechazar el plan de acción. Si el plan de acción es rechazado, este debe regresar al usuario responsable en el modulo de planes de acción para que realice las correcciones necesarias. y se debe poner un comentario de porqué fue rechazado.
- Resultados: Esta sección mostrará estadísticas y gráficos sobre los planes de acción, como el número de planes abiertos, cerrados, tiempo promedio de cierre, etc. Debe ser muy atractivo visualmente y debe tener paginas por departamento y un resumen general para que se puedan presentar ante una sala de juntas.
- Configuración: En esta sección la barra lateral ramificará las siguientes opciones:
    - Usuarios: Gestión de usuarios de la aplicación, asignación de roles (Usuario Normal, Usuario de Calidad, Administrador)
    - Departamentos: Gestión de departamentos a los cuales se les pueden asignar planes de acción.
    - Perfil: Configuración del perfil del usuario actual, incluyendo la opción de cambiar la contraseña y actualizar la información personal.
    - Tiempos limites: En esta opción el usuario administrador o de calidad podrá configurar el tiempo limite que tienen los usuarios para poder llenar los planes de acción.