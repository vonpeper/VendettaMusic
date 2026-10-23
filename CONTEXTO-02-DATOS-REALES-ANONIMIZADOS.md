# CONTEXTO 02: DATOS REALES ANONIMIZADOS Y AUDITORÍA DE REGISTROS

**Sistema:** Vendetta Live Music (`vendetta.mx`)  
**Fuente:** Base de datos activa / Snapshot de Producción (`prod.db.bak`)  
**Carácter:** Consultas Estrictas de Solo Lectura (Datos Sensibles Enmascarados)

---

## 1. CONTEO EXACTO DE REGISTROS POR TABLA

| Tabla Física | Conteo de Filas | Propósito / Rol |
|---|---|---|
| `User` | 18 | Cuentas registradas (Admin: 1, Agente: 1, Clientes: 10, Staff/Músicos: 6) |
| `ClientProfile` | 9 | Perfiles comerciales creados |
| `MusicianProfile` | 5 | Músicos titulares |
| `Substitute` | 4 | Músicos suplentes |
| `BookingRequest` | 8 | Cotizaciones, leads y ventas en el Centro de Ventas |
| `Event` | 10 | Eventos en Agenda |
| `BandEvent` | 28 | Registro contable histórico |
| `Location` | 9 | Recintos y ubicaciones registradas |
| `Package` | 4 | Paquetes activos del catálogo |
| `PackageService` | 4 | Servicios asignados a paquetes |
| `ServiceItem` | 0 | Catálogo de inclusiones (no poblado) |
| `Quote` | 0 | Modelo legacy (reemplazado por BookingRequest) |
| `QuoteItem` | 0 | Líneas de cotización legacy |
| `Payment` | 0 | Modelo de pagos desglosados |
| `Contract` | 0 | Modelo de contratos independientes |
| `Notification` | 16 | Logs de mensajes de WhatsApp y avisos del sistema |
| `InboxItem` | 0 | Mensajes entrantes en bandeja |
| `Provider` | 1 | Proveedor de equipo externo |
| `Song` | 207 | Repertorio musical de la banda |
| `Setlist` | 1 | Lista de temas configurada |
| `SetlistSong` | 0 | Asignación de temas a setlist |
| `Rehearsal` | 1 | Ensayo registrado |
| `RehearsalSong` | 2 | Canciones asignadas a ensayo |
| `RehearsalMusician` | 0 | Asistencia de músicos a ensayo |
| `EventMusician` | 0 | Asignación directa en tabla intermedia |
| `SiteMedia` | 14 | Imágenes y videos de la galería web |
| `Review` | 5 | Testimonios y reseñas aprobadas |
| `PublicBandMember` | 4 | Fichas públicas de los integrantes |
| `GlobalConfig` | 1 | Registro Singleton de configuración general |

---

## 2. DISTRIBUCIÓN DE ESTADOS Y FUENTES

### 2.1 Estados en `BookingRequest` (Total: 8)
* `agendado`: 2 registros (25%)
* `cancelado`: 3 registros (37.5%)
* `completado`: 1 registro (12.5%)
* `pendiente`: 2 registros (25%)

### 2.2 Estados en `Event` (Total: 10)
* `agendado`: 3 registros (30%)
* `completado`: 6 registros (60%)
* `cancelado`: 1 registro (10%)

### 2.3 Fuentes (`source`)
* En `BookingRequest`: `"manual"` (4), `"web"` (3), `"funnel"` (1).
* En `Event`: `"manual"` (7), `"funnel"` (3).

---

## 3. AUDITORÍA DE RELACIONES, NULOS Y REGISTROS HUÉRFANOS

* **Duplicados de Clientes por WhatsApp:** 0 duplicados encontrados.
* **Duplicados de Usuarios por Correo:** 1 duplicado detectado (caso `NO@NO.COM` vs `no@no.com` que fue resuelto en la normalización).
* **Usuarios con rol `CLIENT` sin `ClientProfile`:** 2 usuarios registrados como clientes no tienen fila correspondiente en `ClientProfile`.
* **`BookingRequest` sin `clientId`:** 4 registros de cotizaciones web no tienen `clientId` asociado (se mantienen como leads independientes hasta confirmación).
* **`BookingRequest` sin `eventId`:** 5 registros no tienen evento creado en agenda (cotizaciones pendientes o canceladas).
* **`Event` sin `clientId`:** 1 evento registrado directamente sin cliente vinculado.
* **`Event` sin `locationId`:** 1 evento registrado con dirección manual sin vincular a `Location`.
* **`Location` con prefijo `Show -`:** 5 de las 9 ubicaciones (55%) tienen nombre generado automáticamente tipo `Show - [Cliente]`.
* **`Location` sin ningún evento vinculado:** 3 ubicaciones creadas no tienen eventos asociados.
* **Registros en `Quote`, `QuoteItem`, `Payment`, `Contract`:** 0 registros (la operación se consolidó en `BookingRequest` y `Event`).

---

## 4. MUESTRAS REALES ANONIMIZADAS POR MODELO

### 4.1 Muestra de `BookingRequest` (Anonimizada)
```json
[
  {
    "id": "0c8b...-anon-1",
    "shortId": "VND-7K8P",
    "clientName": "Cliente Empresa A.C.",
    "clientPhone": "55****1234",
    "clientEmail": "contacto@empresa-anon.mx",
    "packageName": "Presentación musical + Producción técnica",
    "requestedDate": "2026-08-20T12:00:00.000Z",
    "startTime": "20:00",
    "endTime": "22:30",
    "baseAmount": 133410.0,
    "depositAmount": 77377.8,
    "paymentMethod": "transfer",
    "paymentStatus": "pending",
    "status": "pendiente",
    "city": "CDMX",
    "state": "Ciudad de México",
    "venueType": "salon",
    "guestCount": 800,
    "hasPantalla": true,
    "hasTemplete": true,
    "clientSignature": null,
    "adminSignature": null,
    "clientId": "client-profile-uuid-1",
    "eventId": null
  },
  {
    "id": "5f3a...-anon-2",
    "shortId": "VND-4M2X",
    "clientName": "Cliente Particular Social",
    "clientPhone": "72****5678",
    "clientEmail": null,
    "packageName": "Essential",
    "requestedDate": "2026-06-15T12:00:00.000Z",
    "startTime": "21:00",
    "endTime": "23:00",
    "baseAmount": 14500.0,
    "depositAmount": 7250.0,
    "paymentMethod": "transfer",
    "paymentStatus": "paid",
    "status": "agendado",
    "city": "Metepec",
    "state": "Estado de México",
    "venueType": "jardin",
    "guestCount": 150,
    "hasPantalla": false,
    "hasTemplete": false,
    "clientSignature": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "adminSignature": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "clientId": "client-profile-uuid-2",
    "eventId": "event-uuid-2"
  },
  {
    "id": "9b1c...-anon-3",
    "shortId": "VND-9Q1Z",
    "clientName": "Prospecto Web Boda",
    "clientPhone": "55****9988",
    "clientEmail": "boda.anon@gmail.com",
    "packageName": "Festival Premium",
    "requestedDate": "2026-11-28T12:00:00.000Z",
    "startTime": "22:00",
    "endTime": "01:00",
    "baseAmount": 45000.0,
    "depositAmount": 22500.0,
    "paymentMethod": "transfer",
    "paymentStatus": "pending",
    "status": "cancelado",
    "city": "Valle de Bravo",
    "state": "Estado de México",
    "venueType": "hacienda",
    "guestCount": 300,
    "hasPantalla": true,
    "hasTemplete": true,
    "clientSignature": null,
    "adminSignature": null,
    "clientId": null,
    "eventId": null
  }
]
```

### 4.2 Muestra de `Event` (Anonimizada)
```json
[
  {
    "id": "event-uuid-1",
    "date": "2026-05-18T12:00:00.000Z",
    "startTime": "21:00",
    "performanceStart": "21:00",
    "performanceEnd": "23:00",
    "amount": 18000.0,
    "deposit": 9000.0,
    "balance": 0.0,
    "status": "completado",
    "ceremonyType": "Boda",
    "guestCount": 200,
    "locationId": "loc-uuid-1",
    "clientId": "client-profile-uuid-2",
    "customName": "Boda Particular",
    "source": "manual"
  },
  {
    "id": "event-uuid-2",
    "date": "2026-06-15T12:00:00.000Z",
    "startTime": "21:00",
    "performanceStart": "21:00",
    "performanceEnd": "23:00",
    "amount": 14500.0,
    "deposit": 7250.0,
    "balance": 7250.0,
    "status": "agendado",
    "ceremonyType": "XV Años",
    "guestCount": 150,
    "locationId": "loc-uuid-2",
    "clientId": "client-profile-uuid-2",
    "customName": "XV Años en Jardín",
    "source": "funnel"
  }
]
```

### 4.3 Muestra de `ClientProfile` (Anonimizada)
```json
[
  {
    "id": "client-profile-uuid-1",
    "userId": "user-uuid-1",
    "company": "Colegio Mexicano de Anestesiología A.C.",
    "type": "corporate",
    "rfc": "CMA********",
    "fiscalAddress": "WTC, Ciudad de México",
    "whatsapp": "55****1234",
    "city": "CDMX",
    "state": "Ciudad de México"
  },
  {
    "id": "client-profile-uuid-2",
    "userId": "user-uuid-2",
    "company": null,
    "type": "social",
    "rfc": null,
    "fiscalAddress": null,
    "whatsapp": "72****5678",
    "city": "Metepec",
    "state": "Estado de México"
  }
]
```

### 4.4 Muestra de `Location` (Anonimizada)
```json
[
  {
    "id": "loc-uuid-1",
    "name": "Casino Codere Lerma",
    "address": "Plaza Sendero, Blvd. Aeropuerto",
    "city": "Lerma",
    "state": "Estado de México",
    "mapsLink": "https://maps.google.com/..."
  },
  {
    "id": "loc-uuid-2",
    "name": "Show - Cliente Particular Social (VND-4M2X)",
    "address": "Av. Las Torres 102, Col. Providencia",
    "city": "Metepec",
    "state": "Estado de México",
    "mapsLink": "https://maps.google.com/..."
  }
]
```
