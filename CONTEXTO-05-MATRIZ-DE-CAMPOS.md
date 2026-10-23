# CONTEXTO 05: MATRIZ CAMPO A CAMPO DE TODOS LOS FORMULARIOS

**Sistema:** Vendetta Live Music (`vendetta.mx`)  
**Carácter:** Catálogo Exhaustivo de Inputs, Payloads, Modelos y Destinos de Datos

---

## MATRIZ INTEGRAL DE CAMPOS DEL SISTEMA

| Etiqueta UI | Componente | Ruta | Nombre Frontend | Payload API | Endpoint / Action | Campo Prisma | Req UI | Req API | Req BD | Valor Inicial | Validación | Dónde se Muestra | PDF | Contrato | WhatsApp | Editable |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **Nombre Completo** | `Step5_Registro` | `/cotizar` | `name` | `clientName` | `POST /api/booking` | `BookingRequest.clientName` | Sí | Sí | Sí | `""` | No vacío | `/admin/ventas/[id]`, `/status/[id]` | Sí | Sí | Sí | Sí |
| **WhatsApp / Teléfono** | `Step5_Registro` | `/cotizar` | `phone` | `clientPhone` | `POST /api/booking` | `BookingRequest.clientPhone` | Sí | Sí | Sí | `""` | 10 dígitos | `/admin/ventas/[id]`, `/admin/clientes` | Sí | Sí | Sí | Sí |
| **Correo Electrónico** | `Step5_Registro` | `/cotizar` | `email` | `clientEmail` | `POST /api/booking` | `BookingRequest.clientEmail` | No | No | No | `""` | Formato email | `/admin/ventas/[id]`, `/admin/clientes` | Sí | Sí | No | Sí |
| **Paquete Seleccionado** | `Step1_Paquete` | `/cotizar` | `packageId` | `packageId` | `POST /api/booking` | `BookingRequest.packageId` | Sí | No | No | `preselected` | Existencia en catálogo | `/admin/ventas/[id]`, `/propuesta/[id]` | Sí | Sí | Sí | Sí |
| **Nombre del Paquete** | `Step1_Paquete` | `/cotizar` | `packageName` | `packageName` | `POST /api/booking` | `BookingRequest.packageName` | Sí | Sí | Sí | `"Essential"` | No vacío | `/admin/ventas/[id]`, `/admin/eventos` | Sí | Sí | Sí | Sí |
| **Horas de Banda** | `Step1_Paquete` | `/cotizar` | `bandHours` | `bandHours` | `POST /api/booking` | `BookingRequest.bandHours` | No | No | No | `2` | Entero >= 1 | `/admin/ventas/[id]`, `/propuesta/[id]` | Sí | Sí | Sí | Sí |
| **Horas de DJ** | `Step1_Paquete` | `/cotizar` | `djHours` | `djHours` | `POST /api/booking` | `BookingRequest.djHours` | No | No | No | `0` | Entero >= 0 | `/admin/ventas/[id]`, `/propuesta/[id]` | Sí | Sí | Sí | Sí |
| **Cabina DJ con Pantallas** | `Step1_Paquete` | `/cotizar` | `isDjWithTvs` | `isDjWithTvs` | `POST /api/booking` | `BookingRequest.isDjWithTvs` | No | No | No | `false` | Booleano | `/admin/ventas/[id]` | Sí | Sí | No | Sí |
| **Templete (Escenario)** | `Step1_Paquete` | `/cotizar` | `hasTemplete` | `hasTemplete` | `POST /api/booking` | `BookingRequest.hasTemplete` | No | No | No | `false` | Booleano | `/admin/ventas/[id]`, `/propuesta/[id]` | Sí | Sí | No | Sí |
| **Pista Iluminada** | `Step1_Paquete` | `/cotizar` | `hasPista` | `hasPista` | `POST /api/booking` | `BookingRequest.hasPista` | No | No | No | `false` | Booleano | `/admin/ventas/[id]` | Sí | Sí | No | Sí |
| **Robot LED** | `Step1_Paquete` | `/cotizar` | `hasRobot` | `hasRobot` | `POST /api/booking` | `BookingRequest.hasRobot` | No | No | No | `false` | Booleano | `/admin/ventas/[id]` | Sí | Sí | No | Sí |
| **Pantalla LED Gigante** | `Step1_Paquete` | `/cotizar` | `hasPantalla` | `hasPantalla` | `POST /api/booking` | `BookingRequest.hasPantalla` | No | No | No | `false` | Booleano | `/admin/ventas/[id]`, `/propuesta/[id]` | Sí | Sí | No | Sí |
| **Número de Invitados** | `Step1_Paquete` | `/cotizar` | `guestCount` | `guestCount` | `POST /api/booking` | `BookingRequest.guestCount` | No | No | No | `100` | Entero > 0 | `/admin/ventas/[id]`, `/admin/eventos` | No | No | No | Sí |
| **Tipo de Lugar / Recinto** | `Step1_Paquete` | `/cotizar` | `venueType` | `venueType` | `POST /api/booking` | `BookingRequest.venueType` | Sí | Sí | Sí | `"salon"` | Select enum | `/admin/ventas/[id]`, `/admin/eventos` | Sí | Sí | No | Sí |
| **Calle** | `Step2_Ubicacion` | `/cotizar` | `street` | `street` | `POST /api/booking` | `BookingRequest.calle` | No | No | No | `""` | Texto | `/admin/ventas/[id]` | Sí | Sí | No | Sí |
| **Número Ext/Int** | `Step2_Ubicacion` | `/cotizar` | `houseNumber` | `houseNumber` | `POST /api/booking` | `BookingRequest.numero` | No | No | No | `""` | Texto | `/admin/ventas/[id]` | Sí | Sí | No | Sí |
| **Colonia** | `Step2_Ubicacion` | `/cotizar` | `colonia` | `colonia` | `POST /api/booking` | `BookingRequest.colonia` | No | No | No | `""` | Texto | `/admin/ventas/[id]` | Sí | Sí | No | Sí |
| **Código Postal** | `Step2_Ubicacion` | `/cotizar` | `zipCode` | `zipCode` | `POST /api/booking` | `BookingRequest.zipCode` | No | No | No | `""` | 5 dígitos | `/admin/ventas/[id]` | Sí | Sí | No | Sí |
| **Municipio / Ciudad** | `Step2_Ubicacion` | `/cotizar` | `municipio` | `city` | `POST /api/booking` | `BookingRequest.municipio`, `BookingRequest.city` | Sí | Sí | Sí | `""` | No vacío | `/admin/ventas`, `/admin/eventos` | Sí | Sí | Sí | Sí |
| **Estado** | `Step2_Ubicacion` | `/cotizar` | `state` | `state` | `POST /api/booking` | `BookingRequest.state` | Sí | Sí | Sí | `"Estado de México"` | Catálogo 32 estados | `/admin/ventas/[id]` | Sí | Sí | No | Sí |
| **Link Google Maps** | `Step2_Ubicacion` | `/cotizar` | `mapsLink` | `mapsLink` | `POST /api/booking` | `BookingRequest.mapsLink` | No | No | No | `""` | URL válida | `/admin/ventas/[id]`, `/admin/eventos` | Sí | Sí | Sí | Sí |
| **Fecha del Evento** | `Step3_Fecha` | `/cotizar` | `requestedDate` | `requestedDate` | `POST /api/booking` | `BookingRequest.requestedDate` | Sí | Sí | Sí | `""` | Fecha válida YYYY-MM-DD | `/admin/ventas`, `/admin/eventos`, `/status` | Sí | Sí | Sí | Sí |
| **Hora de Inicio** | `Step3_Fecha` | `/cotizar` | `startTime` | `startTime` | `POST /api/booking` | `BookingRequest.startTime` | Sí | Sí | Sí | `"21:00"` | Formato HH:mm | `/admin/ventas/[id]`, `/admin/eventos` | Sí | Sí | Sí | Sí |
| **Hora de Fin** | `Step3_Fecha` | `/cotizar` | `endTime` | `endTime` | `POST /api/booking` | `BookingRequest.endTime` | Sí | Sí | Sí | `"23:00"` | Formato HH:mm | `/admin/ventas/[id]`, `/admin/eventos` | Sí | Sí | Sí | Sí |
| **Monto Total Show** | `Step4_Pago` | `/cotizar` | `packagePrice` | `baseAmount` | `POST /api/booking` | `BookingRequest.baseAmount` | Sí | Sí | Sí | Calculado | Numérico >= 0 | `/admin/ventas`, `/status/[id]` | Sí | Sí | Sí | Sí |
| **Monto de Anticipo** | `Step4_Pago` | `/cotizar` | `depositAmount` | `depositAmount` | `POST /api/booking` | `BookingRequest.depositAmount` | Sí | Sí | Sí | 50% de Total | Numérico >= 0 | `/admin/ventas`, `/status/[id]` | Sí | Sí | Sí | Sí |
| **Método de Pago** | `Step4_Pago` | `/cotizar` | `paymentMethod` | `paymentMethod` | `POST /api/booking` | `BookingRequest.paymentMethod` | Sí | Sí | Sí | `"transfer"` | Enum | `/admin/ventas/[id]` | Sí | Sí | No | Sí |
| **Requiere Factura Fiscal** | `ManualQuoteForm` | `/admin/ventas/nueva` | `invoice` | `invoice` | `POST /api/admin/booking-manual` | `BookingRequest.invoice` | No | No | No | `false` | Booleano | `/admin/ventas/[id]`, `/admin/eventos` | Sí | Sí | No | Sí |
| **Descuento en Dinero** | `ManualQuoteForm` | `/admin/ventas/nueva` | `discountAmount` | `discountAmount` | `POST /api/admin/booking-manual` | `BookingRequest.discountAmount` | No | No | No | `0` | Numérico >= 0 | `/admin/ventas/[id]` | Sí | Sí | No | Sí |
| **Notas Internas / Bitácora** | `ManualQuoteForm` | `/admin/ventas/nueva` | `adminNote` | `adminNote` | `POST /api/admin/booking-manual` | `BookingRequest.adminNote` | No | No | No | `""` | Texto libre | `/admin/ventas/[id]` | No | No | No | Sí |
| **Notas para Músicos** | `EventForm` | `/admin/eventos` | `musicianNotes` | `musicianNotes` | `createEventAction` | `Event.musicianNotes` | No | No | No | `""` | Texto libre | Portal Músico, WhatsApp Gig | No | No | Sí | Sí |
| **Hora de Llegada Staff** | `EventForm` | `/admin/eventos` | `arrivalTime` | `arrivalTime` | `createEventAction` | `Event.arrivalTime` | No | No | No | `""` | Formato HH:mm | `/admin/eventos`, WhatsApp Gig | No | No | Sí | Sí |
| **Hora de Montaje** | `EventForm` | `/admin/eventos` | `setupTime` | `setupTime` | `createEventAction` | `Event.setupTime` | No | No | No | `""` | Formato HH:mm | `/admin/eventos`, WhatsApp Gig | No | No | Sí | Sí |
| **Código de Vestimenta** | `EventForm` | `/admin/eventos` | `dressCode` | `dressCode` | `createEventAction` | `Event.dressCode` | No | No | No | `"Formal / Rock Elegante"` | Texto | `/admin/eventos`, WhatsApp Gig | No | No | Sí | Sí |
| **Ingeniero de Audio** | `EventForm` | `/admin/eventos` | `audioEngineer` | `audioEngineer` | `createEventAction` | `Event.audioEngineer` | No | No | No | `""` | Texto | `/admin/eventos` | No | No | No | Sí |
| **RFC Fiscal** | `ClienteForm` | `/admin/clientes` | `rfc` | `rfc` | `createClienteAction` | `ClientProfile.rfc` | No | No | No | `""` | 12-13 caracteres | `/admin/clientes`, `/propuesta/[id]` | Sí | Sí | No | Sí |
| **Razón Social / Empresa** | `ClienteForm` | `/admin/clientes` | `company` | `company` | `createClienteAction` | `ClientProfile.company` | No | No | No | `""` | Texto | `/admin/clientes` | Sí | Sí | No | Sí |
| **Domicilio Fiscal** | `ProposalInteractive`| `/propuesta/[id]` | `fiscalAddress` | `fiscalAddress` | `saveClientLegalDataAction` | `ClientProfile.fiscalAddress` | No | No | No | `""` | Texto | `/propuesta/[id]`, Contrato PDF | Sí | Sí | No | Sí |
| **Representante Legal** | `ProposalInteractive`| `/propuesta/[id]` | `legalRepName` | `legalRepName` | `saveClientLegalDataAction` | `ClientProfile.legalRepName` | No | No | No | `""` | Texto | Contrato PDF | Sí | Sí | No | Sí |
| **Poder Notarial** | `ProposalInteractive`| `/propuesta/[id]` | `legalRepPower` | `legalRepPower` | `saveClientLegalDataAction` | `ClientProfile.legalRepPower` | No | No | No | `""` | Texto | Contrato PDF | Sí | Sí | No | Sí |
| **Firma Digital Cliente** | `ContractSigner` | `/status/[id]` | `signatureBase64`| `signatureBase64`| `signContractAction` | `BookingRequest.clientSignature` | Sí | Sí | No | `""` | Base64 PNG | `/admin/ventas/[id]`, Contrato PDF | Sí | Sí | No | Sí |
| **Firma Digital Vendetta** | `AdminSignature` | `/admin/configuracion`| `signatureBase64`| `signatureBase64`| `saveAdminSignatureAction`| `GlobalConfig.adminSignature` | Sí | Sí | No | `""` | Base64 PNG | Contrato PDF, `/status/[id]` | Sí | Sí | No | Sí |
