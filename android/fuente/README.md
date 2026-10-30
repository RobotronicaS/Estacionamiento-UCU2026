# Estaciona Salto UCU · Android 0.1.3


## Consulta pública al instalar

Esta edición conecta automáticamente al servidor de la Raspberry del grupo 1, con la demostración local desactivada. El celular necesita Internet; no necesita Tailscale ni una cuenta de acceso a la API. Dirección inicial:

https://oxide-land-psychological-gonna.trycloudflare.com

**Es una dirección temporal de prueba.** Depende del túnel y del servidor que están funcionando en la Raspberry. Al reiniciar el túnel puede cambiar el dominio. Antes del uso habitual se debe configurar un dominio fijo y mantener el servidor y el túnel en ejecución automática. Si el dominio cambia, esta APK permite corregirlo en Ajustes; para que futuras instalaciones sigan conectando sin configurar, hay que actualizar también la dirección incluida en la aplicación.

La API actual genera lecturas simuladas en Python cada 10 segundos. La app lo indica como datos de prueba del servidor y no los atribuye al MPF-1. No representa disponibilidad real. Conserva el mapa satelital y la distribución propuesta de seis plazas.

Al actualizar una instalación anterior que tenía el servidor vacío, la app configura la dirección pública, el grupo 1 y la consulta remota. Conserva las conexiones que el usuario ya había configurado. No se ha probado la instalación en un teléfono físico durante esta sesión.


Esta actualización abre en el estacionamiento del fondo de la UCU, en **-31.389172, -57.958842**, y representa seis plazas como rectángulos P1–P6. Verde indica libre, rojo ocupada y gris sin lectura vigente. El punto viene del enlace compartido; la distribución de las plazas es una propuesta por ajustar con el relevamiento del patio. Cada rectángulo está asociado a E001–E006 y a los bits 0–5.

La APK conserva el identificador y la firma de las versiones anteriores. Se puede instalar sobre ellas. Abre en **vista satelital**, con un selector **Satélite / Calles**. El mapa base necesita Internet; los rectángulos también se dibujan cuando no carga el mapa. Si el servidor todavía no aporta coordenadas por plaza, se usan las posiciones propuestas de la UCU.

El contenedor Android reserva el espacio de las barras del sistema y del recorte de pantalla antes de mostrar el WebView. El menú inferior queda dentro de esa superficie, por encima de los botones o gestos de Android.

Primera APK del Proyecto Integrador 2. Cliente de consulta de estacionamientos para Android 8.0 o posterior.

## Instalar y probar

1. Copiá `Estaciona-Salto-UCU-0.1.3.apk` al celular y abrilo.
2. Si Android lo solicita, autorizá a esa aplicación a instalar el archivo.
3. Abrí **Estaciona Salto**. Se conecta automáticamente al servidor público del grupo 1.
4. Probá Mapa, Plazas e Historial. El botón superior vuelve a consultar la Raspberry. Ajustes permite cambiar la conexión o elegir expresamente una demostración local.

El punto del estacionamiento está confirmado por el enlace. Las coordenadas individuales de P1–P6 y sus medidas de 2,5 × 5 m son una propuesta, no un relevamiento. Los estados de demostración tampoco representan disponibilidad real. El mapa base necesita Internet; la demostración y la lista funcionan sin él.

## Conectar al servidor del curso

En **Ajustes**, desactivá Modo demostración, escribí el dominio HTTPS publicado por Cloudflare y elegí el equipo. Guardá. No escribas `/api/estado` al final: la app agrega la ruta.

La dirección temporal está configurada y las dos rutas de lectura se probaron con el servidor de la Raspberry. Falta un dominio permanente y la integración de las lecturas del MPF-1 con el almacenamiento del curso.

| Tramo | Conexión |
| --- | --- |
| MPF-1 → notebook en clase | RS-232 mediante adaptador USB |
| Notebook → Raspberry Pi 5 en casa | Red privada Tailscale |
| Raspberry Pi 5 ↔ APK Android | API HTTPS por Cloudflare Tunnel |

La Raspberry guarda y procesa los datos. La APK consulta; no inserta lecturas ni accede directamente a PostgreSQL. El token de escritura de la pasarela no se incluye en el teléfono. La primera implementación supone datos públicos de consulta; no implementa inicio de sesión de Cloudflare Access. Si se protege la lectura con Access, debe agregarse el flujo de autenticación apropiado.

## Comportamiento de los datos

- Actualización cada 10 segundos mientras la app está visible.
- Cada plaza conserva la fecha de la lectura del servidor. Descargarla de nuevo no renueva su vigencia.
- Al vencer `vigencia_segundos`, el estado pasa a **Sin datos**. También se rechazan fechas más de cinco segundos en el futuro.
- Se conserva localmente la última respuesta válida por servidor y equipo. Una falla de Internet se indica en pantalla.
- Si la fuente del servidor es simulada, se muestra como datos de prueba del servidor; no se atribuye a un dispositivo concreto.
- El historial viene del servidor. En demostración se genera en el teléfono; los dos historiales no se mezclan.
- Mapa con desplazamiento, zoom, centrado y marcadores; lista con filtros; historial por fecha; ajustes persistentes.

## Código y compilación

`src/` contiene el host Android en Java; `assets/` contiene la interfaz HTML, CSS y JavaScript empaquetada dentro de la APK. La guía `COMO_PROGRAMAR.md` explica qué editar y cómo compilar. No descarga una página web de la Raspberry para funcionar. El acceso a la API se realiza con HTTPS nativo, fuera del WebView, por lo que no requiere CORS para la APK.

La app no solicita ubicación, contactos, cámara, archivos ni instalación de Tailscale. Usa únicamente el permiso de Internet.

Para compilar en Windows, usar un JDK y Android SDK Build Tools. Ejemplo:

```powershell
.\build.ps1 -BuildTools 'C:\Android\Sdk\build-tools\35.0.0' `
  -AndroidJar 'C:\Android\Sdk\platforms\android-35\android.jar' `
  -JdkRoot 'C:\Java\jdk-17'
```

El script crea una firma de desarrollo en `signing/classroom.keystore`, alias `androiddebugkey`, contraseña de desarrollo `android`. La copia entregada en el paquete permite conservar la identidad al reconstruir esta versión de clase. No es una firma de publicación en Google Play.

La compilación inicial utiliza las herramientas Android ya disponibles en la PC: plataforma API 28 para compilar, `minSdkVersion=26` y `targetSdkVersion=35`. No depende de bibliotecas nativas y no necesita descargar Gradle ni dependencias. Para producción, actualizar las herramientas a la plataforma objetivo y completar las pruebas en dispositivos.

## Pruebas

```powershell
node tests/core.test.js
node tests/geometry.cjs
# Con Playwright y Chrome disponibles:
node tests/ui.cjs
```

Se verifican máscaras de seis plazas, vencimiento, caché, fechas, datos inválidos, separación por equipo, configuración HTTPS y los flujos de interfaz. La firma e identidad de la APK se verifican con apksigner y aapt. El archivo `VERIFICACION.md` registra los resultados de esta entrega y lo pendiente.

## Mapa y licencias

Vista satelital de Esri World Imagery, con atribución visible a Esri, Maxar, Earthstar Geographics y la comunidad GIS. Servicio: https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer

En el punto de la UCU, el nivel 18 tiene cobertura y el 19 devuelve una imagen de «sin datos». La app amplía la imagen disponible del nivel 18 al acercarse; no implica más resolución fotográfica.

Vista de calles de OpenStreetMap, con atribución visible, agente identificable y caché normal del WebView. Solo se solicitan las teselas del área visible; no hay descarga de mapas para uso sin conexión. Política: https://operations.osmfoundation.org/policies/tiles/

Las pruebas automáticas usan una imagen sintética local para verificar la carga de teselas y bloquean las descargas externas. La cuadrícula de respaldo es una ilustración; se indica que hace falta Internet. Las imágenes son un fondo de referencia y no determinan la disponibilidad de las plazas.
