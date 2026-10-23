# PAQUETE DE CONTEXTO MAESTRO: VENDETTA LIVE MUSIC

**Sistema:** Vendetta Live Music (`vendetta.mx`)  
**Propósito:** Paquete integral y descriptivo de arquitectura, base de datos, flujos comerciales, pantallas y formularios para comprensión técnica completa sin inferencias ni propuestas prematuras.  
**Fecha:** 21 de Agosto de 2026

---

## ÍNDICE GENERAL DEL PAQUETE DE CONTEXTO

1. 📄 **[CONTEXTO-01-ESQUEMA-VENDETTA.md](file:///Users/ppbau/Documents/Antigravity/GitHub/vonpeper/VendettaMusic/CONTEXTO-01-ESQUEMA-VENDETTA.md)**
   * Inventario exhaustivo de todos los modelos Prisma declarados y tablas físicas.
   * Lista completa de todos los campos, tipos, obligatoriedad, valores por defecto, índices, FKs y relaciones.
   * Mecanismos de persistencia y modificaciones dinámicas en runtime (`ensureSchemaUpToDate` en `src/lib/db.ts`).
   * Diagrama Entidad-Relación relacional completo en formato Mermaid.

2. 📄 **[CONTEXTO-02-DATOS-REALES-ANONIMIZADOS.md](file:///Users/ppbau/Documents/Antigravity/GitHub/vonpeper/VendettaMusic/CONTEXTO-02-DATOS-REALES-ANONIMIZADOS.md)**
   * Conteos reales de filas por tabla observable en base de datos.
   * Análisis de nulos, vacíos, distribución de estados y fuentes.
   * Detección de duplicados, relaciones huérfanas y prefijos `Show -` en ubicaciones.
   * Muestras reales anonimizadas conservando tipos, estados, montos y llaves foráneas.

3. 📁 **[contexto-dashboard/](file:///Users/ppbau/Documents/Antigravity/GitHub/vonpeper/VendettaMusic/contexto-dashboard)**
   * Inventario visual completo compuesto por 20 capturas de interfaz desktop anonimizadas:
     * `01-admin-dashboard.svg`: Panel principal de métricas y agenda.
     * `02-admin-ventas.svg`: Tabla y filtros del Centro de Ventas.
     * `03-admin-ventas-nueva.svg`: Formulario de alta de cotización/venta manual.
     * `04-admin-ventas-detalle.svg`: Ficha detallada de cotización/contrato.
     * `05-modal-editar-booking.svg`: Modal de edición de cotización.
     * `06-modal-cambiar-estatus.svg`: Modal de cambio de estatus.
     * `07-modal-reportar-anticipo.svg`: Modal de confirmación de anticipo.
     * `08-admin-clientes.svg`: Directorio de clientes.
     * `09-modal-alta-cliente.svg`: Modal de nuevo cliente.
     * `10-modal-editar-cliente.svg`: Modal de edición de cliente.
     * `11-admin-eventos.svg`: Calendario maestro de eventos.
     * `12-modal-alta-evento.svg`: Modal de nuevo evento en agenda.
     * `13-modal-editar-evento.svg`: Modal de edición de evento en agenda.
     * `14-admin-pagos.svg`: Panel de control financiero.
     * `15-modal-detalle-pago.svg`: Modal de detalle de transacción.
     * `16-admin-locations.svg`: Catálogo de recintos y locaciones.
     * `17-admin-configuracion.svg`: Configuración de viáticos, Evolution API y firma digital.
     * `18-admin-inbox-notificaciones.svg`: Bandeja de WhatsApp entrante y logs.
     * `19-portal-propuesta-cliente.svg`: Portal del cliente con cotización interactiva.
     * `20-portal-status-contrato.svg`: Portal de firma digital y contrato en PDF.

4. 📄 **[CONTEXTO-03-DASHBOARD-Y-FORMULARIOS.md](file:///Users/ppbau/Documents/Antigravity/GitHub/vonpeper/VendettaMusic/CONTEXTO-03-DASHBOARD-Y-FORMULARIOS.md)**
   * Desglose funcional pantalla por pantalla: componentes, tablas consultadas, filtros, buscadores, botones y modales.
   * Modelos leídos, modelos modificados y notificaciones generadas en cada vista.

5. 📄 **[CONTEXTO-04-RECORRIDOS-ACTUALES.md](file:///Users/ppbau/Documents/Antigravity/GitHub/vonpeper/VendettaMusic/CONTEXTO-04-RECORRIDOS-ACTUALES.md)**
   * Trazo paso a paso de los 9 recorridos comerciales principales (desde el cotizador web público hasta la liquidación y firma del contrato).
   * Payloads, endpoints, funciones ejecutoras y transiciones de estado.

6. 📄 **[CONTEXTO-05-MATRIZ-DE-CAMPOS.md](file:///Users/ppbau/Documents/Antigravity/GitHub/vonpeper/VendettaMusic/CONTEXTO-05-MATRIZ-DE-CAMPOS.md)**
   * Matriz campo a campo de todos los inputs visibles de formularios del sistema.
   * Mapeo de etiqueta UI -> Nombre frontend -> Payload -> Endpoint -> Modelo Prisma -> PDF/Contrato/WhatsApp.
