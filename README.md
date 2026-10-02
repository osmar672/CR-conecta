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

El chat envía las preguntas a la API Node y de ahí a Groq; la clave nunca se entrega al navegador. Puede responder preguntas abiertas y orientar sobre CR Conecta. El contexto del prototipo no adjunta perfiles, solicitudes privadas ni datos personales. Cuando identifica una sección pública pertinente, puede llevar al usuario a Inicio, Necesidades, Donar, Solicitar ayuda o Acceso. El servidor y la interfaz validan cada destino contra una lista cerrada: no se permite navegar por el asistente a otros sitios web, al panel administrativo ni a perfiles personales. Las acciones de Donar y Solicitar ayuda pueden requerir una sesión. La IA puede equivocarse; no ingreses información personal ni sensible.

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

## Avisos con n8n

Importá `n8n/CR-Conecta-Avisos-y-Comprobantes.json` en n8n. El flujo tiene dos entradas Webhook: una para solicitudes que pasan a **Aprobada** y otra para donaciones nuevas. La API envía cada evento después de guardarlo; editar una solicitud ya aprobada no repite el aviso. n8n prepara un correo al equipo con la necesidad aprobada, o un correo con el nuevo aporte y su comprobante de registro en HTML. Este comprobante no acredita la entrega física, no es una factura ni un certificado fiscal.

Antes de activar el flujo, configurá en **ambos Webhook** una credencial **Header Auth** con el nombre `X-CR-Conecta-Token` y el mismo valor secreto, y en **ambos Send Email** una credencial SMTP. Reemplazá `avisos@ejemplo.invalid` y `equipo@ejemplo.invalid` con direcciones reales autorizadas. Probá primero las URL de prueba con el Webhook escuchando; publicá el flujo y copiá luego sus URL de producción a tu `.env` de la API:

```text
N8N_APPROVAL_WEBHOOK_URL=https://tu-n8n.example/webhook/cr-conecta-solicitud-aprobada
N8N_DONATION_WEBHOOK_URL=https://tu-n8n.example/webhook/cr-conecta-donacion-registrada
N8N_WEBHOOK_TOKEN=un-secreto-aleatorio-largo
```

Reiniciá `npm run server` después de guardar `.env`. No pongás el secreto ni las URL privadas en variables `VITE_*` ni en el frontend. Sin estas variables los avisos quedan desactivados; si n8n falla, la solicitud o donación ya guardada conserva su resultado y la API deja una advertencia en la consola. Revisá las ejecuciones de n8n para verificar que el correo salió. Solo se transmiten identificador, categoría, zona, cantidad y estado de la necesidad, o los datos del aporte; no se transmiten nombres, perfiles, direcciones de correo ni IDs de usuarios. En este prototipo no hay reintentos automáticos de avisos fallidos.

La entrega local de este proyecto incluye un `.env` listo con las URL de prueba de n8n en `localhost:5678` y un token de demostración generado para esta copia. Abrí `.env` en tu computadora y copiá el valor de `N8N_WEBHOOK_TOKEN` al campo **Value** de la credencial Header Auth de ambos Webhook; el campo **Name** es `X-CR-Conecta-Token`. Si ya tenías un `.env` con tu clave de Groq, conservá esa clave al unir la configuración; no reemplaces tu archivo sin revisar. El token de demostración es para desarrollo local: generá otro antes de publicar o compartir el proyecto.

## Panel administrativo

El resumen del administrador reúne indicadores y gráficas de cuentas por rol, solicitudes por estado y comunidad, donaciones por categoría y estado, inventario, traslados y campañas. También muestra las últimas acciones auditadas. Se registran inicios de sesión correctos, cambios de perfil, creación y actualización de solicitudes, donaciones y entregas de traslados. El historial se guarda en `db.json`, conserva hasta 500 eventos y solo el administrador puede consultarlo; no incluye acciones anteriores a esta función ni visitas o navegación por páginas.

Administración, en su resumen, y las empresas donantes, en «Campañas y empleo», pueden generar con IA una proyección semanal para la próxima campaña. Se especifican categoría, meta y duración; el resultado incluye gráfico, explicación y supuestos. La API envía a Groq solamente datos resumidos de campañas y donaciones que corresponden al rol (la empresa solo ve los suyos), sin nombres, perfiles ni información personal. Son escenarios orientativos basados en datos simulados y escasos, no resultados garantizados. Requiere `GROQ_API_KEY` y un `GROQ_MODEL` compatible configurados en `.env`.

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

## Foto obligatoria de la donación

El menú principal incluye Donar. Cada aporte nuevo requiere una foto JPG, PNG o WebP de hasta 10 MB. El navegador la convierte a JPEG y reduce su tamaño antes de enviarla. La API valida el formato y tamaño y la guarda en el campo `photo` de la donación en `db.json`. La foto se muestra en la lista de aportes; los registros antiguos siguen disponibles aunque no tengan foto.
