# Cómo se programa Estaciona Salto

La aplicación combina una parte Android en **Java** con una interfaz en **HTML, CSS y JavaScript**, guardada dentro de la APK. Android muestra esa interfaz mediante un WebView. Se puede editar el código con Visual Studio Code u otro editor y compilar con el script incluido.

| Lenguaje | Función | Archivo principal |
| --- | --- | --- |
| Java | Abre la aplicación, reserva el espacio de las barras de Android, guarda la configuración y consulta la API HTTPS. | `src/uy/edu/ucu/estacionasalto/MainActivity.java` |
| HTML | Define las pantallas Mapa, Plazas, Historial y Ajustes. | `assets/index.html` |
| CSS | Define colores, tamaños, rectángulos y menú inferior. | `assets/style.css`, `assets/safe-layout.css` |
| JavaScript | Actualiza estados, valida lecturas, dibuja el mapa y responde a los botones. | `assets/app.js`, `assets/core.js`, `assets/ucu-map.js` |

## Cambios habituales

- Para cambiar textos o agregar un botón, editar `assets/index.html`.
- Para cambiar la apariencia, editar los CSS. El espacio de las barras de Android se corrige también en Java, en `applySafeInsets`.
- Para cambiar las seis plazas, editar las coordenadas y dimensiones en `assets/ucu-map.js`. La distribución entregada es una propuesta, pendiente de relevamiento.
- Para cambiar validaciones de los estados o la demostración, editar `assets/core.js`.
- La versión 0.1.3 incluye una dirección pública temporal del grupo 1. Para cambiar la dirección predeterminada de nuevas instalaciones, editar PUBLIC_SERVER en Java y la configuración inicial de assets/app.js, manteniendo ambos valores iguales. El usuario también puede cambiarla en Ajustes. El contrato de las rutas está en api/CONTRATO.md.

La vista **Satélite** usa imágenes de Esri World Imagery. **Calles** usa OpenStreetMap. Ambas necesitan Internet para cargar el fondo. Las imágenes no detectan vehículos: los colores de las plazas proceden de las lecturas de la API o de la demostración indicada en pantalla.

## Compilar una APK

El proyecto usa herramientas de línea de comandos del Android SDK y un JDK. No contiene un proyecto Gradle. En PowerShell, desde esta carpeta:

```powershell
.\build.ps1 -BuildTools 'C:\Android\Sdk\build-tools\35.0.0' `
  -AndroidJar 'C:\Android\Sdk\platforms\android-35\android.jar' `
  -JdkRoot 'C:\Java\jdk-17'
```

Reemplazar las tres rutas por las herramientas instaladas. El script admite `dx` de herramientas antiguas o `d8` de herramientas nuevas. Esta entrega se compiló con el JDK 8 y la plataforma API 28 disponibles en la PC, declarando Android 8 como mínimo y API 35 como objetivo.

El resultado queda en `dist/Estaciona-Salto-UCU-0.1.3.apk`. Conservar `signing/classroom.keystore`: la misma firma permite instalar actualizaciones sobre las versiones anteriores de clase. La clave original no se incluye en GitHub. Si se genera una clave nueva, Android no permite actualizar una APK firmada con la anterior; se debe conservar la clave original fuera del repositorio o desinstalar primero la app, perdiendo sus ajustes.

## Verificar y empaquetar

```powershell
node tests/core.test.js
node tests/geometry.cjs
node tests/public-start.cjs
# Requiere Playwright y Chrome:
node tests/ui.cjs
python tools/package.py
```

La Raspberry es un programa separado. Puede implementar la API en Python, por ejemplo, pero el servidor no forma parte de esta APK. El teléfono consulta por HTTPS el dominio publicado mediante Cloudflare; Tailscale conecta la notebook de clase con la Raspberry.
