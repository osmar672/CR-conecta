# CR Conecta — Prototipo académico

Implementación frontend inspirada en el mockup entregado y basada en los requerimientos de CR Conecta.

## Stack
- React + Vite
- React Router
- JSON Server + `db.json`
- QR local con `qrcode`

## Ejecutar
```bash
npm install
npm run server
```
En otra terminal:
```bash
npm run dev
```
Abrí la URL que muestre Vite.

Si el servidor JSON corre en otra dirección, creá un archivo `.env` con `VITE_API_URL=http://localhost:3001` (ese es el valor por defecto). Si el servidor no responde, la aplicación muestra un aviso arriba con un botón para reintentar.

## Requerimientos Implementados (RF-01 a RF-10)

| ID | Requerimiento | Implementación en el Prototipo |
|---|---|---|
| **RF-01** | Selección de cuenta demo, login y logout persistente | Selector de perfiles precargados desde `db.json`, persistencia en `localStorage` (`cr_session`) y modal de confirmación de salida. |
| **RF-02** | Acceso visual tipo Google/Gmail con aviso de simulación | Botón visual "Continuar con Google", selector de cuentas asociando correos de `db.json`, con advertencia explícita de que Google y n8n no autentican realmente. |
| **RF-03** | Vistas y acciones acordes al rol | Interfaz adaptativa para Administrador, Beneficiario, Donante, Empresa, Voluntario y Aliado comunitario. |
| **RF-04** | Edición de datos no sensibles del perfil | Modal de edición en `/perfil` (nombre, contacto telefónico ficticio, zona, notas) con guardado directo vía `PATCH /users/:id` en `db.json`. |
| **RF-05** | Perfil de beneficiario y consulta de ayudas | Panel exclusivo para el Beneficiario con sus datos de hogar, historial de solicitudes, estados, dictámenes y confirmación de entrega. |
| **RF-06** | Ficha limitada protegida para donantes y voluntarios | Modal de ficha pública con datos generales de la necesidad aprobada, resguardando la identidad y datos sensibles del beneficiario. |
| **RF-07** | Registro de solicitud con estado inicial "En revisión" | Formulario con categoría, descripción, cantidad/unidad, zona y fecha; se guarda con estado inicial `En revisión`. |
| **RF-08** | Evaluación administrativa (Aprobar/Denegar con motivo y fecha) | Modal de evaluación administrativa con registro de decisión, motivo fundamentado y fecha de resolución. |
| **RF-09** | Asignación de prioridad (Alta, Media, Baja) | Selector de prioridad por parte del administrador visible en tarjetas y tablas con distintivos de color (Alta=Rojo, Media=Ámbar, Baja=Azul). |
| **RF-10** | Control de límites y bloqueo por exceso con excepción | Comparación automática contra límites configurados por categoría. Si se excede, la aprobación se bloquea hasta registrar una justificación y autorización de excepción administrativa. |

## Guía de Demostración Rápida
1. **Acceso (RF-01, RF-02)**: Clic en *"Quiero ayudar"* o *"Cambiar rol"*, usar el acceso tipo Google para entrar como María Administradora o Ana Beneficiaria.
2. **Beneficiaria (RF-05, RF-07, RF-10)**: Entrar como Ana Beneficiaria. Formular una solicitud ordinaria o una que supere 20 paquetes para ver la alerta de límite.
3. **Administradora (RF-08, RF-09, RF-10)**: Entrar como María Administradora. Ir a *Panel de gestión > Solicitudes*. Revisar la solicitud `#CC-207` que excede el límite: verificar el bloqueo de aprobación y desbloquearla mediante el registro de la excepción administrativa.
4. **Edición de Perfil (RF-04)**: Clic en el chip de usuario o en `/perfil`, editar el teléfono o zona y verificar el guardado en `db.json`.
5. **Ficha Protegida (RF-06)**: Ir a *Inicio* o *Necesidades*, hacer clic en *"Ver ficha pública (RF-06)"* para verificar el resguardo de la identidad.

