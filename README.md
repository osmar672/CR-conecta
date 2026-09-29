# CR Conecta

Prototipo académico para coordinar solicitudes, donaciones y voluntariado. Toda la información de `db.json` es ficticia; no usar datos personales o casos reales.

## Requisitos

- Node.js 20.19+ o 22.12+
- npm

## Desarrollo local

Desde la carpeta `CR-conecta`:

```powershell
npm install
npm run server
```

En otra terminal:

```powershell
npm run dev
```

La interfaz estará en la dirección que indique Vite (por defecto `http://localhost:5173`). La API corre en `http://localhost:3001`. Para cambiarla, copiá `.env.example` a `.env` y ajustá `VITE_API_URL`; `CLIENT_ORIGIN` configura el origen permitido de la interfaz en el servidor.

Las cuentas de demostración comparten la contraseña `conecta-demo` únicamente en desarrollo local. La pantalla de acceso solicita la contraseña y no usa Google/Gmail: ese flujo sigue siendo una simulación explícitamente identificada como tal.

## Asistente de IA

El chat envía las preguntas a la API Node y de ahí a Groq; la clave nunca se entrega al navegador. El contexto del modelo describe solo las páginas y flujos públicos del prototipo, no adjunta perfiles, solicitudes privadas ni datos personales. Las instrucciones del asistente le limitan a CR Conecta y le indican rechazar preguntas fuera del sitio; aun así, la IA puede equivocarse. No ingreses información personal ni sensible.

El archivo `.env` local ya está creado con un marcador, no con una clave funcional. Reemplazá `pon-tu-clave-aqui` por tu propia clave de Groq, guardá el archivo y reiniciá `npm run server`:

```text
GROQ_API_KEY=tu-clave-real
GROQ_MODEL=qwen/qwen3.8-27b
```

`.env` está ignorado por Git. Nunca pegues la clave en el frontend, en una variable `VITE_*`, en el repositorio ni en capturas. Si el asistente indica que no está configurado, revisá `GROQ_API_KEY` y reiniciá el servidor.

## API propia y autorización

`npm run server` inicia la API Node implementada en `server/`; ya no se expone JSON Server. Las contraseñas configuradas se almacenan como hashes scrypt con sal aleatoria en `server/auth.json`, archivo local ignorado por Git. Las sesiones usan cookies `HttpOnly`, `SameSite=Strict` y vencen después de ocho horas. La API verifica roles y propiedad de cada registro; ocultar botones en la interfaz no cuenta como autorización.

| Operación | Permiso |
|---|---|
| Consultar necesidades aprobadas | Público; se omiten datos internos y beneficiario |
| Ver solicitudes propias | Beneficiario autenticado |
| Consultar todas y evaluar solicitudes | Administrador |
| Crear solicitudes | Beneficiario autenticado; el servidor fija propietario y estado inicial |
| Confirmar entrega | Solo beneficiario dueño de la solicitud aprobada |
| Registrar donaciones | Donante individual o empresa; el destino debe ser una solicitud aprobada |
| Consultar donaciones propias | Donantes |
| Actualizar traslados | Administrador o voluntario asignado |
| Consultar inventario | Administrador |
| Editar datos básicos de perfil | Propietario del perfil o administrador |
| Consultar actividad del sistema | Administrador |

Las validaciones de cantidad, estado, prioridad y excepción se ejecutan en la API, no solo en React. La regla de recurrencia considera solicitudes aprobadas o en revisión de los últimos 60 días. La persistencia local escribe `db.json` de forma serializada y atómica.

## Panel administrativo

El resumen del administrador reúne indicadores y gráficas de cuentas por rol, solicitudes por estado y comunidad, donaciones por categoría y estado, inventario, traslados y campañas. También muestra las últimas acciones auditadas. Se registran inicios de sesión correctos, cambios de perfil, creación y actualización de solicitudes, donaciones y entregas de traslados. El historial se guarda en `db.json`, conserva hasta 500 eventos y solo el administrador puede consultarlo; no incluye acciones anteriores a esta función ni visitas o navegación por páginas.

## Preparar contraseñas para despliegue

En producción no se acepta la contraseña compartida de demo. Configurá una contraseña distinta y robusta por cuenta desde una terminal interactiva:

```powershell
$env:NODE_ENV = "production"
npm run auth:set-password -- u1
npm run auth:set-password -- u2
```

Repetí el comando para cada ID de cuenta habilitado (`u1` a `u6`). El comando no muestra la contraseña mientras se escribe. Después configurá el servidor detrás de HTTPS y establece, en su entorno:

```text
NODE_ENV=production
CLIENT_ORIGIN=https://tu-dominio.example
PORT=3001
```

El cookie `Secure` se activa en producción. El frontend necesita compilarse con `VITE_API_URL` apuntando a la API y alojarse en el origen permitido. No publiques `server/auth.json` ni copies `.env` al repositorio.

**Límite importante:** esta API y el archivo JSON son una base de prototipo, no una plataforma lista para gestionar casos reales. Las sesiones y el límite de intentos de acceso viven en memoria y se invalidan al reiniciar el servidor; el archivo no es adecuado para varias instancias ni escrituras concurrentes entre procesos. La auditoría actual es básica y no registra visitas a páginas. Antes de uso público o información sensible, sustituí JSON por una base de datos transaccional, guardá sesiones y límites de acceso compartidos y persistentes, ampliá la auditoría con controles de retención, copias de seguridad, monitorización y revisión legal/de privacidad.

## Calidad

```powershell
npm test
npm run lint
npm run build
```

Las pruebas comprueban límites de solicitud, autenticación, acceso por rol, privacidad de necesidades y validación de destinos de donación.
