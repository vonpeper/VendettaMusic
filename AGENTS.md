<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:operations-directive -->
# Directivas de Operación y Arquitectura (Vendetta Music)

Este proyecto corre en producción utilizando contenedores gestionados por systemd/Quadlet y Traefik v3 como reverse proxy con certificados SSL automáticos.

## 1. Reglas de Oro de Arquitectura
1. **Contenedores y Servicios:** La arquitectura corre con Podman Quadlet / systemd units.
2. **Red & Reverse Proxy:** Se conecta a la red compartida con etiquetas de Traefik para enrutamiento y certificados SSL automáticos.
3. **Flujo de Despliegue / Actualización:**
   - La configuración de variables de entorno reside en archivos `.env` protegidos fuera del repositorio de código.
   - Las units de servicio se gestionan mediante systemd.

## 2. Reglas para Agentes al Modificar Código
1. **Lee antes de escribir.** Revisa el contexto antes de editar y sigue las convenciones existentes.
2. **Cambios mínimos y enfocados.** Toca solo lo necesario para la tarea.
3. **Secrets y entorno.** Nunca hardcodees claves, contraseñas, teléfonos ni credenciales en el código; usa variables de entorno debidamente tipadas y aisladas.
4. **Verificación obligatoria.** Asegura que `npm run ts-check` y `npm run build` compilen sin errores antes de entregar.
<!-- END:operations-directive -->
