# Verificación de Estaciona Salto UCU 0.1.3

Comprobación pública: Comprobación real anterior en esta conversación, 20/10/2026; hora exacta no retenida.

- Identidad: uy.edu.ucu.estacionasalto; versión 0.1.3; código 4.
- APK compilada desde Java y los recursos incluidos en este paquete, con JDK 8 y Android SDK API 28.
- Android mínimo API 26; objetivo declarado API 35; permiso INTERNET.
- Firma v2 verificada con apksigner. Certificado SHA-256: d48374c317e589f0afe21a7522e9f6dc28ccda7b119444a4043a000b89a20c26, igual al de las versiones anteriores.
- Instalación nueva: servidor público de grupo1 y demostración local desactivada por defecto. La actualización migra las preferencias con servidor vacío y conserva servidores configurados por el usuario.
- Diez pruebas del núcleo aprobadas: estados, fechas, vigencia, HTTPS, equipos e historial.
- Pruebas de geometría, mapa satelital/calles, seis rectángulos y atribuciones aprobadas.
- Pruebas de inicio automático en navegador aprobadas para instalación nueva, preferencias antiguas sin servidor y servidor personalizado; una elección posterior de demostración local se conserva al recargar.
- Pruebas de interfaz con puente nativo simulado aprobadas: cuatro pantallas, filtros, ajustes, caché, fallos de conexión, lectura vencida, historial inválido, anchos 320/360/412/650 y menú dentro de viewports con barras de 24/48/80 píxeles.
- Los ensayos de mapa usan imágenes sintéticas locales para evitar descargas automáticas del proveedor. Se conservan las fuentes, atribuciones y distribución propuesta de la UCU de la versión anterior.
- API pública real comprobada anteriormente en esta conversación por HTTPS: estado HTTP 200, historial HTTP 200, 6 plazas del grupo1 y 3 eventos recibidos. La lectura tenía 4,2 segundos de antigüedad y vigencia de 20 segundos.
- Revisión de disponibilidad al compilar: No verificado: timeout TLS desde el entorno de compilación. No acredita una caída de la Raspberry ni del túnel.
- Fuente actual: simulador-python; simulado=true. La interfaz lo identifica como datos de prueba del servidor, sin atribuirlos al MPF-1.

## Límites y trabajo pendiente

La dirección de trycloudflare.com incluida es temporal. Esta entrega permite probar el acceso público mientras se mantengan funcionando el servidor y ese túnel. Para uso habitual faltan un dominio fijo y el arranque automático del servidor y del túnel. El cierre o recreación del túnel puede dejar esta dirección sin servicio.

No se instaló esta APK en un teléfono Android físico durante la sesión. Falta verificar en el dispositivo la instalación/actualización, las barras de navegación y la consulta HTTPS nativa. Falta conectar el MPF-1, guardar las lecturas en la base del curso y relevar las coordenadas individuales de las plazas. No son datos reales de disponibilidad.
