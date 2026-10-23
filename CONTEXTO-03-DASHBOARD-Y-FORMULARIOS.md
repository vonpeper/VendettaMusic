# CONTEXTO 03: MAPA DE PANTALLAS DEL DASHBOARD Y FORMULARIOS

**Sistema:** Vendetta Live Music (`vendetta.mx`)  
**Carácter:** Documentación Descriptiva de Pantallas, Componentes y Acciones Disponibles

---

## 1. PANTALLAS DEL PANEL ADMINISTRATIVO

### 1.1 `/admin` — Panel Principal (Dashboard)
* **Componente:** `src/app/admin/page.tsx`
* **Propósito:** Vista general del estado comercial, calendario inmediato y métricas financieras.
* **Lo que ve el administrador:**
  * Tarjetas de resumen: Próximos Shows (conteo de `Event` con status `agendado`), Total de Ingresos (suma de `amount` y `totalIncome`), Cotizaciones pendientes (`BookingRequest` con status `pendiente`), Notificaciones pendientes.
  * Gráfica de ingresos mensuales (`IncomeChart.tsx`).
  * Lista de próximos eventos con fecha, cliente, lugar y estado de asignación de músicos.
* **Tablas consultadas:** `Event`, `BookingRequest`, `ClientProfile`, `Location`, `Notification`.
* **Botones / Acciones disponibles:** Enlaces a `/admin/ventas`, `/admin/eventos`, `/admin/clientes`, `/admin/configuracion`.

---

### 1.2 `/admin/ventas` — Centro de Ventas (Listado de Cotizaciones)
* **Componente:** `src/app/admin/ventas/page.tsx` / `VentasTableClient.tsx`
* **Propósito:** Gestión y seguimiento de prospectos, cotizaciones y reservas.
* **Lo que ve el administrador:**
  * Filtros de estatus: Todos, Pendientes, Agendados, Cancelados, Completados.
  * Buscador en vivo por Folio (`shortId`), Nombre del Cliente o Municipio.
  * Tabla con columnas: Folio (`VND-XXXX`), Cliente, Teléfono/WhatsApp, Fecha Solicitada, Paquete/Formato, Monto Total, Anticipo, Estatus, Acciones.
* **Botones / Acciones disponibles:**
  * Botón `"Nueva Cotización"` -> Redirige a `/admin/ventas/nueva`.
  * Botón `"Ver / Gestionar"` -> Redirige a `/admin/ventas/[id]`.
  * Botón de WhatsApp directo para contactar al cliente con plantilla prellenada.
  * Botón de cancelación rápida (`CancelBookingButton.tsx`).

---

### 1.3 `/admin/ventas/nueva` — Alta de Cotización / Venta Manual
* **Componente:** `src/app/admin/ventas/nueva/page.tsx` / `ManualQuoteForm.tsx`
* **Propósito:** Creación directa de cotizaciones paramétricas o registro inmediato de eventos con anticipo.
* **Lo que ve el administrador:**
  * **Sección 1: Cliente:** Nombre, WhatsApp, Correo (opcional). Autocompleta clientes existentes si se selecciona del directorio.
  * **Sección 2: Fecha y Horarios:** Selector de fecha (o múltiples fechas), Hora de inicio, Hora de fin.
  * **Sección 3: Formato / Paquete:** Selector de paquetes del catálogo (`Essential`, `Festival Premium`, `Manual`).
  * **Sección 4: Opcionales de Producción:** Horas de Banda, Horas de DJ, Cabina DJ con Pantallas, Templete, Pista iluminada, Robot LED, Pantalla gigante.
  * **Sección 5: Logística y Viáticos:** Calle, Número, Colonia, Municipio/Ciudad, Estado, Link de Google Maps, Tipo de recinto. Botón para recalcular viáticos automáticos por Google Maps.
  * **Sección 6: Desglose Económico:** Precio original, Descuento, Viáticos calculados, Monto base total, Anticipo (50%).
  * **Sección 7: Confirmación Inmediata (Switch):** Switch `"Anticipo ya pagado / Confirmar fecha inmediatamente"`.
* **Qué ocurre al guardar:**
  * Envía `POST /api/admin/booking-manual`.
  * Ejecuta `findOrCreateClient` -> Crea `User` y `ClientProfile` si no existen.
  * Si se indicó dirección, ejecuta `findOrCreateLocation`.
  * Crea registro en `BookingRequest`.
  * Si el switch de anticipo está activo (`depositConfirmed = true`):
    * Crea registro en `Event` con status `agendado`.
    * Vincula `BookingRequest.eventId = Event.id`.
    * Crea `Payment` con status `completed`.
    * Asigna músicos titulares (`assignDefaultMusicians`).
    * Sincroniza con Google Calendar.
  * Redirección a `/admin/ventas`.

---

### 1.4 `/admin/ventas/[id]` — Detalle y Gestión de Venta
* **Componente:** `src/app/admin/ventas/[id]/page.tsx`
* **Propósito:** Centro de control individual de un contrato/cotización.
* **Lo que ve el administrador:**
  * Folio `shortId` y estado actual.
  * Ficha del cliente (Nombre, WhatsApp, Correo, Ciudad).
  * Ficha del evento (Fecha, Horarios, Ubicación con enlace a Maps, Paquete y Extras).
  * Panel Financiero: Monto total, Anticipo, Saldo pendiente, Método de pago, Referencia bancaria.
  * Estado de firmas digitales (Visualización de firmas Base64 de Cliente y Administrador).
  * Enlaces públicos al portal del cliente: `/propuesta/[shortId]` y `/status/[shortId]`.
* **Modales y Acciones disponibles en esta pantalla:**
  1. **Modal Editar Reserva (`EditBookingDialog.tsx`):** Permite cambiar fecha, horarios, dirección, paquete y reajustar anticipo (`updateDepositAmountAction`).
  2. **Modal Cambiar Estatus (`BookingStatusSwitcher.tsx`):** Cambiar entre `pendiente`, `agendado`, `cancelado`, `completado` (`updateBookingStatusAction`).
  3. **Botón Confirmar Anticipo (`ConfirmarAnticipoButton.tsx`):** Registra el pago del 50%, crea el `Event`, bloquea la agenda y dispara notificaciones (`confirmDepositPaidAction`).
  4. **Botón Liquidar Saldo (`LiquidarButton.tsx`):** Registra el pago restante y marca `BookingRequest` y `Event` como `completado`.
  5. **Botón Seguimiento WhatsApp (`FollowUpButton.tsx`):** Envía mensaje de seguimiento vía Evolution API.
  6. **Botón Eliminar Contrato (`DeleteContractButton.tsx`):** Elimina el contrato o cancela la reserva.

---

### 1.5 `/admin/clientes` — Directorio de Clientes
* **Componente:** `src/app/admin/clientes/page.tsx` / `ClientesTableClient.tsx`
* **Propósito:** Catálogo de clientes particulares, corporativos y agencias.
* **Lo que ve el administrador:**
  * Tabla con Nombre, Tipo (`Social` / `Corporativo`), WhatsApp, Ciudad, Eventos contratados, Fecha de registro.
* **Modales y Acciones:**
  * **Modal Nuevo Cliente (`ClienteForm.tsx`):** Nombre completo, Correo (opcional), WhatsApp, Tipo, Empresa, RFC, Dirección fiscal, Notas. Llama a `createClienteAction`.
  * **Modal Editar Cliente (`ClienteForm.tsx`):** Modifica datos de contacto y facturación. Llama a `updateClienteAction`.
  * **Botón Eliminar Cliente (`ClienteActions.tsx`):** Llama a `deleteClienteAction`.

---

### 1.6 `/admin/eventos` — Agenda de Shows
* **Componente:** `src/app/admin/eventos/page.tsx` / `MasterEventsTable.tsx`
* **Propósito:** Gestión de la agenda artística, tiempos de soundcheck y plantilla de músicos por fecha.
* **Lo que ve el administrador:**
  * Filtro por mes y año.
  * Calendario mensual con códigos de color según estatus (`agendado`, `completado`, `cancelado`).
  * Tabla maestra de shows con fecha, nombre de evento/cliente, recinto, horario de show, horario de montaje, ingenieros de audio asignados.
* **Modales y Acciones:**
  * **Modal Alta de Evento (`EventForm.tsx`):** Creación directa en agenda. Llama a `createEventAction`.
  * **Modal Edición de Evento (`EventForm.tsx`):** Actualización de horarios, notas de músicos, ingeniero y bitácora. Llama a `updateEventAction`.
  * **Botón Notificar a Músicos (`EventActions.tsx`):** Envía convocatoria por WhatsApp a todo el elenco asignado (`notifyEventAction`).

---

### 1.7 `/admin/pagos` — Control Financiero
* **Componente:** `src/app/admin/pagos/page.tsx`
* **Propósito:** Monitoreo de flujo de caja, anticipos recibidos y cobranza de saldos.
* **Lo que ve el administrador:**
  * Resumen de ingresos confirmados vs saldos por cobrar.
  * Tabla de pagos con Fecha, Cliente/Evento, Monto, Método (`Transferencia`, `Efectivo`, `Stripe`), Estado (`completed`, `pending`), Referencia.

---

### 1.8 `/admin/locaciones` — Catálogo de Venues
* **Componente:** `src/app/admin/locaciones/page.tsx` / `LocationsClient.tsx`
* **Propósito:** Mantenimiento de recintos frecuentes, salones y haciendas.
* **Lo que ve el administrador:**
  * Nombre del lugar, Dirección, Ciudad/Municipio, Enlace a Google Maps, Teléfono, Eventos realizados.
  * Acciones: Alta de nueva locación, edición y borrado.

---

### 1.9 `/admin/configuracion` — Parámetros Globales
* **Componente:** `src/app/admin/configuracion/page.tsx`
* **Propósito:** Configuración técnica y comercial del sistema.
* **Lo que ve el administrador:**
  * **Viáticos:** Radio local sin costo (km), Tarifa Zona 2, Tarifa Zona 3, Ciudades asignadas por zona.
  * **Evolution API (WhatsApp):** URL base del servidor, API Key, Nombre de la instancia (`vendetta_admin`), Teléfono de Pepe/Administrador, Webhook Secret.
  * **Datos Bancarios:** Banco, Número de Cuenta, CLABE Interbancaria, Beneficiario.
  * **Firma Digital de Vendetta:** Canvas interactivo para dibujar y guardar la firma oficial que se estampa automáticamente en los contratos (`saveAdminSignatureAction`).
  * **Plantillas de WhatsApp:** Editor de plantillas para Cotización, Confirmación, Recordatorio, Agradecimiento y Convocatoria de músicos.

---

### 1.10 `/admin/inbox` — Bandeja de Atención WhatsApp
* **Componente:** `src/app/admin/inbox/page.tsx`
* **Propósito:** Gestión de mensajes entrantes recibidos por el webhook de Evolution API.
* **Lo que ve el administrador:**
  * Mensajes clasificados por intención (`new_lead`, `customer_action_required`, `customer_reply`).
  * Enlace directo al `BookingRequest` o `ClientProfile` asociado al número remitente.

---

## 2. PANTALLAS PÚBLICAS Y PORTALES DE CLIENTE

### 2.1 `/cotizar` — Cotizador Público Multietapa
* **Componente:** `src/app/(public)/cotizar/page.tsx` / `FunnelWizard.tsx`
* **Propósito:** Embudo de conversión interactivo de 5 pasos para el prospecto.
* **Flujo de pasos:**
  * Paso 1: Selección de paquete base o configuración de show a la medida.
  * Paso 2: Ubicación geográfica y cálculo de viáticos en tiempo real.
  * Paso 3: Selección de fecha y horario de show con verificación de disponibilidad.
  * Paso 4: Desglose de inversión (Monto Total, Anticipo sugerido del 50%).
  * Paso 5: Registro de Nombre, WhatsApp y Correo. Botón "Confirmar Solicitud" dispara `POST /api/booking`.

### 2.2 `/contacto` — Página de Contacto
* **Componente:** `src/app/(public)/contacto/page.tsx`
* **Propósito:** Información de contacto directo (WhatsApp, Correo, Teléfono). Formulario visual de consulta.

### 2.3 `/propuesta/[id]` — Propuesta Interactiva
* **Componente:** `src/app/(public)/propuesta/[id]/page.tsx` / `ProposalInteractive.tsx`
* **Propósito:** Vista interactiva personalizada que recibe el cliente con su folio `shortId`.
* **Acciones del cliente:**
  * Puede activar/desactivar opcionales (Pantalla LED, Templete, Producción de audio) con recálculo de precio en tiempo real (`updateProposalSelectionsAction`).
  * Puede llenar sus datos fiscales y legales para el contrato (`saveClientLegalDataAction`).
  * Botón `"Aceptar Propuesta"` bloquea la cotización y la transfiere a contratación formal (`acceptProposalAction`).

### 2.4 `/status/[id]` — Portal de Estatus y Firma de Contrato
* **Componente:** `src/app/(public)/status/[id]/page.tsx` / `ContractSigner.tsx`
* **Propósito:** Portal donde el cliente consulta el avance de su fecha, revisa el contrato oficial en PDF y estampa su firma digital en pantalla (`signContractAction`).
