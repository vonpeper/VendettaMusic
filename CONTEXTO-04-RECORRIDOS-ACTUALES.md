# CONTEXTO 04: RECORRIDOS REALES DE DATOS PASO A PASO

**Sistema:** Vendetta Live Music (`vendetta.mx`)  
**Carácter:** Trazo Descriptivo y Secuencial de Flujos Existentes (Sin Modificaciones)

---

## RECORRIDO A: Solicitud Generada desde `/cotizar` (Funnel Público)

```
1. Pantalla: /cotizar (FunnelWizard: Steps 1 a 5)
2. Campos capturados:
   - Step 1: packageId, packageName, bandHours, djHours, isDjWithTvs, hasTemplete, hasPista, hasRobot, guestCount, venueType.
   - Step 2: street, houseNumber, colonia, zipCode, municipio, city, state, mapsLink.
   - Step 3: requestedDate, startTime, endTime.
   - Step 4: paymentMethod (transfer/cash/stripe), depositAmount (50% base).
   - Step 5: clientName, clientPhone, clientEmail.
3. Payload JSON enviado a: POST /api/booking
4. Función ejecutora: POST() en src/app/api/booking/route.ts
5. Escritura en Base de Datos:
   - Se crea registro en BookingRequest con:
     * id: UUID generado.
     * shortId: VND-XXXX (generado aleatoriamente).
     * status: 'pendiente'.
     * paymentStatus: 'pending'.
     * clientId: null.
     * eventId: null.
     * viaticosAmount: calculado con Google Maps API.
6. Efectos secundarios y Notificaciones:
   - dispatchNotification({ type: "ADMIN_NEW_BOOKING", bookingId }) -> Envía WhatsApp de alerta al número de Pepe/Admin configurado en GlobalConfig.
7. Siguiente pantalla:
   - Renderiza FunnelSuccess.tsx mostrando el Folio VND-XXXX y botón de WhatsApp.
```

---

## RECORRIDO B: Cotización Manual desde `/admin/ventas/nueva`

```
1. Pantalla: /admin/ventas/nueva (ManualQuoteForm.tsx)
2. Campos capturados:
   - clientName, clientPhone, clientEmail (opcional).
   - requestedDate (o requestedDates[]), startTime, endTime.
   - packageId, bandHours, djHours, extras booleanos.
   - calle, numero, colonia, municipio, state, venueType, mapsLink.
   - originalPrice, discountAmount, viaticosAmount, baseAmount, depositAmount.
   - paymentMethod, adminNote, depositConfirmed (switch booleano).
3. Payload JSON enviado a: POST /api/admin/booking-manual
4. Función ejecutora: POST() en src/app/api/admin/booking-manual/route.ts
5. Escritura en Base de Datos:
   - Paso 5.1: findOrCreateClient() busca User por email o ClientProfile por whatsapp. Si no existe, crea User y ClientProfile. Retorna clientId.
   - Paso 5.2: findOrCreateLocation() busca o crea Location con nombre del lugar o Show - [Cliente]. Retorna finalLocationId.
   - Paso 5.3: Se crea BookingRequest (id: UUID, shortId: VND-XXXX, clientId, status: depositConfirmed ? 'agendado' : 'pendiente').
   - Paso 5.4 (Si depositConfirmed == true):
     * Se crea Event (id: UUID, clientId, locationId, date, amount, deposit, balance, status: 'agendado').
     * Se actualiza BookingRequest.eventId = Event.id.
     * Se crea Payment (amount: depositAmount, method: 'TRANSFER', status: 'completed').
     * Se asignan músicos titulares en EventMusician (assignDefaultMusicians).
     * Sincroniza con Google Calendar (syncEventToGoogleCalendar).
6. Siguiente pantalla:
   - Redirección automática a /admin/ventas con mensaje de éxito.
```

---

## RECORRIDO C: Alta Manual de Cliente desde `/admin/clientes`

```
1. Pantalla: /admin/clientes (ClienteForm.tsx en modal)
2. Campos capturados:
   - name, email (opcional), whatsapp, state, city, type (social/corporate), company, rfc, notes.
3. Payload FormData enviado a Server Action: createClienteAction() en src/actions/clientes.ts
4. Escritura en Base de Datos:
   - Crea User (name, email, passwordHash predeterminado, role: 'CLIENT').
   - Crea ClientProfile anidado (userId, whatsapp, state, city, type, company, rfc, notes).
5. Siguiente pantalla:
   - Revalida ruta /admin/clientes y cierra el modal mostrando toast de confirmación.
```

---

## RECORRIDO D: Cliente Existente que Contrata Otro Evento

```
1. Pantalla: /admin/ventas/nueva o /cotizar
2. Detección de Cliente:
   - El cliente ingresa su mismo número de WhatsApp o correo.
3. Al procesar en findOrCreateClient():
   - Busca en ClientProfile where: { whatsapp: cleanWhatsApp }.
   - Encuentra el clientProfile existente.
   - Actualiza nombre y ciudad si cambiaron.
   - Retorna el clientProfile.id existente sin crear un nuevo User ni duplicar ClientProfile.
4. Se crea un nuevo BookingRequest vinculado al clientId ya existente.
5. El cliente conserva en su historial todos sus eventos anteriores.
```

---

## RECORRIDO E: Venue Existente Reutilizado

```
1. Pantalla: /admin/ventas/nueva o /admin/eventos
2. Selección del Venue:
   - El administrador elige un recinto del catálogo existente (ej. "Casino Codere Lerma").
3. Al guardar:
   - El locationId del venue seleccionado se asigna directamente a Event.locationId y BookingRequest.
   - No se crea ninguna fila nueva en la tabla Location.
```

---

## RECORRIDO F: Domicilio Particular (Casa / Jardín Privado)

```
1. Pantalla: /cotizar o /admin/ventas/nueva
2. Captura de Dirección:
   - Se ingresa calle, número y colonia particular (ej. "Av. Morelos 45, San Gaspar").
3. Al procesar en findOrCreateLocation():
   - Como el nombre no coincide con un recinto comercial del catálogo, la función genera el nombre: Show - [Nombre del Cliente] (VND-XXXX).
   - Crea una nueva fila en Location con esa dirección particular.
   - Asigna el locationId resultante al evento.
```

---

## RECORRIDO G: Confirmación de Anticipo en `/admin/ventas/[id]`

```
1. Pantalla: /admin/ventas/[id] (Botón Confirmar Anticipo / ConfirmarAnticipoButton.tsx)
2. Función ejecutora: confirmDepositPaidAction(bookingId) en src/actions/ventas.ts
3. Escritura en Base de Datos:
   - Paso 3.1: Actualiza BookingRequest setting paymentStatus = 'paid', status = 'agendado'.
   - Paso 3.2: Si no tiene clientId, ejecuta findOrCreateClient() para crear User y ClientProfile.
   - Paso 3.3: Si no tiene eventId, crea el registro en Event (date: requestedDate, amount: baseAmount, deposit: depositAmount, balance: baseAmount - depositAmount, status: 'agendado').
   - Paso 3.4: Vincula BookingRequest.eventId = Event.id.
   - Paso 3.5: Asigna músicos titulares (assignDefaultMusicians).
   - Paso 3.6: Crea registro en Payment (amount: depositAmount, method: 'TRANSFER', status: 'completed').
4. Notificaciones disparadas:
   - dispatchNotification({ type: "CLIENT_CONFIRMED", bookingId }) -> Envía WhatsApp al cliente confirmando fecha bloqueada con enlace a /status/[shortId].
   - dispatchNotification({ type: "MUSICIAN_GIG", eventId }) -> Envía WhatsApp a los músicos titulares con fecha, lugar y link de auto-confirmación.
5. Siguiente pantalla:
   - Revalida /admin/ventas/[id] y actualiza los badges a 'Agendado' y 'Anticipo Pagado'.
```

---

## RECORRIDO H: Generación y Firma Digital de Contrato

```
1. Pantalla: /status/[shortId] (ContractSigner.tsx)
2. El cliente visualiza el desglose legal y dibuja su firma en el canvas interactivo.
3. Al presionar "Firmar Contrato":
   - Convierte el trazo a Base64 (signatureBase64).
   - Invoca Server Action: signContractAction(bookingId, signatureBase64) en src/actions/signatures.ts.
4. Escritura en Base de Datos:
   - Obtiene adminSignature desde GlobalConfig.
   - Actualiza BookingRequest con:
     * clientSignature: signatureBase64.
     * adminSignature: adminSignature de Vendetta.
     * signedAt: now().
     * signedIp: IP capturada en headers.
     * status: 'agendado'.
   - Si existe Event asociado, busca o crea Contract con status: 'signed'.
5. Notificaciones:
   - dispatchAdminAlert() -> Envía WhatsApp a Pepe notificando que el cliente firmó el contrato.
6. Siguiente pantalla:
   - El portal /status/[shortId] cambia de estado, muestra el badge verde "Contrato Firmado" y habilita el botón para descargar el PDF oficial generado por contract-generator.ts.
```

---

## RECORRIDO I: Pago y Liquidación Final

```
1. Pantalla: /admin/ventas/[id] (Botón Liquidar / LiquidarButton.tsx)
2. Función ejecutora: markBookingAsCompleted(bookingId) en src/actions/ventas.ts
3. Escritura en Base de Datos:
   - Actualiza BookingRequest setting status = 'completado', paymentStatus = 'paid'.
   - Actualiza Event setting status = 'completado', balance = 0.
4. Siguiente pantalla:
   - Revalida /admin/ventas/[id] y /admin/eventos, archivando el show como completado en el balance histórico.
```
