# Ampliacion: cuatro grupos independientes - 21/10/2026

Para que cada grupo instale y mantenga su propia copia, empezar por
GUIA_TRABAJO_INDEPENDIENTE.md y las paginas 6-10 del PDF. El docente ejecuta
rpi/preparar_grupos_independientes.sh; cada estudiante usa mi_grupo.py
desde su cuenta. Las paginas 1-5 y el contenido anterior se conservan
como recorrido previo. El instalador general anterior queda para el docente.
Esta ampliacion se probo localmente; falta su validacion en la Raspberry.

---

# Estacionamiento UCU — instalación y pruebas

Proyecto Integrador 2 · Microprocesadores · Jonatan Piuma · UCU Salto

Edición actualizada: 21/10/2026.

## Resultado comprobado

En UCU2026 se comprobaron los cuatro servicios de API y los cuatro túneles:
todos active y enabled después de reiniciar. Las cuatro consultas locales y
las cuatro consultas HTTPS devolvieron el grupo correcto, seis plazas
simuladas E001–E006 y una última lectura vigente. Se corroboró el nuevo
arranque por el cambio de Boot ID. IP Tailscale comprobada: 100.72.228.96.

El usuario informó que la APK funcionó antes de reiniciar. Después del
reinicio cambiaron las direcciones públicas. Queda pendiente confirmar la APK
con la dirección nueva; también siguen pendientes dominio fijo y datos reales.

Las pruebas se ejecutaron por el docente y se revisaron sus salidas. El
asistente no consiguió acceso SSH propio. No se realizó una nueva instalación
desde este ZIP ni una comparación binaria con los archivos remotos.

## Elegir la operación

- Instalación nueva: rpi/instalar_estacionamiento_ucu.sh.
- Sistema ya configurado, después de reiniciar o cambiar túneles:
  rpi/verificar_despues_reinicio.sh. Consulta y guarda las URL vigentes sin
  reiniciar otra vez los servicios.
- Explicaciones y comandos: las dos láminas A3 y COMANDOS_PARA_COPIAR.txt.
- Evidencia y comparación con el A3 anterior:
  evidencia/Registro_Verificacion_Estacionamiento_UCU.md.

## Preparación y distribución

Raspberry Pi Imager: RPi5, sistema de 64 bits, usuario ucu2026, nombre
ucu2026, SSH con contraseña y red. El ensayo confirmó Debian 13 arm64;
no se obtuvo evidencia independiente de la variante Lite seleccionada.
Grabar la misma microSD sobrescribe sus datos; conservar respaldo previo.

En la prueba, el docente pegó en Bash el bloque completo del instalador y
ejecutó bash ~/instalar_estacionamiento_ucu.sh. El paquete incluye esa lógica,
sus archivos Python y sus plantillas con formato uniforme. Los scripts están
completos: no dependen de descargar código de un repositorio del proyecto.

La alternativa ZIP/SCP siguiente está preparada para distribuir archivos y no
fue la ruta ejecutada en el ensayo. Descargar este ZIP actualizado en
Descargas de Windows y extraerlo en una carpeta nueva. En PowerShell:

```powershell
$zip = "$env:USERPROFILE\Downloads\Estacionamiento_UCU_Paquete_Completo.zip"
$dir = "$env:USERPROFILE\Downloads\Estacionamiento_UCU"
Expand-Archive -LiteralPath $zip -DestinationPath $dir
scp -r "$dir\rpi" ucu2026@ucu2026.local:
ssh ucu2026@ucu2026.local
```

Al copiar rpi al home, sus archivos quedan en ~/rpi. Dentro de la Raspberry,
para una instalación nueva:

```bash
bash ~/rpi/instalar_estacionamiento_ucu.sh
```

El instalador se ejecuta como ucu2026. Solicita sudo y la contraseña de cada
grupo que cree. No se guardan los valores de contraseña. Instala dependencias,
crea cuatro entornos, despliega las unidades y prueba las API. La autorización
de Tailscale requiere abrir el enlace en un navegador. Su espera es de 180 s;
si termina el plazo, el instalador continúa y marca ese paso PENDIENTE.
Completar después con sudo tailscale up. El enlace de autorización se muestra
en la terminal y se excluye del log del instalador.

La creación de túneles modifica sus URL. Guardar y conectar en la APK con la
dirección de su equipo después de esa operación. No reutilizar una lista de
direcciones anterior después de reiniciar los túneles.

## Usuarios, grupos y acceso privado

| Grupo | Usuario | Puerto | Servicio API | Servicio de túnel |
|---|---|---|---|---|
| 1 | grupo1 | 5001 | estacionamiento@1 | estacionamiento-tunel@1 |
| 2 | grupo2 | 5002 | estacionamiento@2 | estacionamiento-tunel@2 |
| 3 | grupo3 | 5003 | estacionamiento@3 | estacionamiento-tunel@3 |
| 4 | grupo4 | 5004 | estacionamiento@4 | estacionamiento-tunel@4 |

Cada proyecto está en /home/grupoN/PI2/estacionamiento y tiene su .venv.
La API se ejecuta como grupoN, sin privilegios de root. Cuatro desarrollos
didácticos no equivalen a 24 plazas físicas.

Cada PC de clase necesita Tailscale instalado y una identidad autorizada. La
cuenta Linux no autoriza por sí sola la PC. El docente comparte la Raspberry
o incorpora el equipo a la red del curso y comprueba políticas para SSH/TCP 22.
En Windows, una vez autorizado:

```powershell
ssh grupo1@100.72.228.96
```

Cambiar grupo1 según el grupo. La IP se debe comprobar después de reinstalar.
La huella ED25519 de esta instalación es:

```text
SHA256:JSR/i/U6rb/MehNms31PXn/xe+pHOgaZj0ANx73hrgs
```

## Después de reiniciar

Conectar de nuevo como ucu2026 y ejecutar en Bash:

```bash
bash ~/rpi/verificar_despues_reinicio.sh
```

El verificador consulta las ocho unidades individualmente y prueba cuatro API
locales y cuatro HTTPS. Busca las URL solo en el journal del arranque actual.
Valida grupo, simulado=true, seis IDs únicos, estados y lectura vigente.
Usa un archivo temporal y reemplaza ~/PI2_instalacion/direcciones_apk.txt solo
si todas las comprobaciones aprueban. Si falla, conserva el archivo anterior,
que puede contener direcciones caducadas; no lo toma como prueba de vigencia.

Una consulta directa a /api/estado es de lectura; no actualiza la fecha de
la medición. El simulador genera datos cada 10 s; su vigencia es de 20 s.
El historial de hasta 500 eventos está en memoria y se pierde al reiniciar.

## Direcciones comprobadas después del reinicio del 21/10

| Equipo | URL base temporal |
|---|---|
| 1 | https://goals-acts-changed-sign.trycloudflare.com |
| 2 | https://compact-earlier-previous-appear.trycloudflare.com |
| 3 | https://chicken-casa-walter-charlie.trycloudflare.com |
| 4 | https://frog-resulting-enrolled-arts.trycloudflare.com |

Son las últimas verificadas, no dominios permanentes. Cambian al recrear o
reiniciar cada túnel. Usar el archivo recién regenerado para obtener las
direcciones vigentes en otra fecha.

## APK

La APK Android 0.1.3 se conserva sin recompilar y requiere Android 8 o posterior.
Instalar android/Estaciona-Salto-UCU-0.1.3.apk si falta. En Ajustes:

1. Desactivar Modo demostración.
2. En Dirección del servidor HTTPS, pegar solo la URL base del equipo.
3. Elegir el Equipo correspondiente.
4. Tocar Guardar y conectar.
5. Probar con datos móviles, Wi-Fi desactivado y Tailscale desconectado en el teléfono.

La URL inicial de la APK es anterior: actualizarla en Ajustes. No añadir
/api/estado, parámetros ni el puerto 5001 al campo del dominio.
La demo local de la APK y la simulación de la Raspberry son fuentes distintas.
Los rectángulos del mapa son posiciones propuestas, pendientes de relevamiento.

## Unidades systemd y diferencias respecto de la entrega anterior

La API usa --host 0.0.0.0 para escuchar en las interfaces LAN/Tailscale sin
fijar la antigua IP. El túnel consulta http://127.0.0.1:500N con protocolo
http2. Los dos servicios corren como grupoN y reintentan si terminan con error.
Las continuaciones de línea de las plantillas distribuidas son equivalentes
a los ExecStart de una línea generados por el instalador.

El servidor incluido corresponde al código entregado durante la instalación,
con formato uniforme: host predeterminado 127.0.0.1, parámetro --host
configurable y simulado=true también en la raíz. No es el mismo archivo byte
por byte que el servidor de la primera entrega, que fijaba la IP antigua.

La edición anterior mostraba adduser, apt y copia manual por SCP. El bloque
ejecutado usó useradd más passwd, apt-get y generación de archivos en Bash.
La bitácora registra esas diferencias y las pruebas de cada paso.

## Dominio fijo — preparado, no desplegado

Hace falta una cuenta y dominio administrado en Cloudflare. Crear un túnel
con nombre y rutas de hostname propio hacia http://127.0.0.1:5001–5004.
La sección 12 del A3 muestra los comandos de instalación del conector con token.
Revisar el servicio cloudflared existente antes de instalar un conector global;
si corresponde a otro proyecto, integrar las rutas en ese conector.

Mantener el token en el servidor y excluirlo del material y la APK. La app
actual consulta públicamente sin un inicio de sesión Access por navegador.
Comprobar los dominios nuevos antes de dejar de usar las direcciones de prueba.

## Validado y pendiente

Validado mediante salidas reales compartidas por el docente: instalación de
paquetes, cuatro cuentas y entornos, cuatro API, cuatro túneles, grupo aislado,
historial, datos recientes y arranque después de reiniciar. El usuario informó
que la APK funcionó antes del reinicio. Falta repetirla con la URL nueva.
La prueba aislada de cerrar SSH no se registró por separado.

Pendiente de implementación/validación: dominio permanente, sensores, MPF-1,
interfaz de bus/entradas y serial, pasarela, contrato de trama y CRC, receptor
de mediciones, almacenamiento persistente y coordenadas de cada plaza.
Esta API simulada no recibe lecturas de hardware ni acredita disponibilidad real.

## Integridad y archivos

SHA256SUMS.txt contiene los hashes de todos los demás archivos del paquete.
Los scripts integrales están en rpi; los bloques visibles del PDF están en
COMANDOS_PARA_COPIAR.txt, con terminal y usuario. No ejecutar ese TXT como
un único script: incluye bloques independientes de PowerShell, Bash y comandos
opcionales que no deben mezclarse en una misma terminal.

## Fuentes oficiales

- https://www.raspberrypi.com/software/
- https://www.raspberrypi.com/documentation/computers/getting-started.html
- https://tailscale.com/docs/install/linux
- https://tailscale.com/docs/install/windows
- https://tailscale.com/docs/features/sharing
- https://pkg.cloudflare.com/index.html
- https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/
- https://developers.cloudflare.com/tunnel/get-started/
- https://manpages.debian.org/trixie/systemd/systemd.service.5.en.html


## Ampliación: dónde encontrar y usar los archivos

El PDF de laminas conserva completas las dos páginas originales y suma tres
páginas: 3, mapa de archivos; 4, extracción, copia e instalación/verificación;
5, reinicio, APK y rutas generadas. GUIA_DEL_ZIP.md contiene el mismo recorrido
como texto, con comandos copiables y pruebas opcionales. Los PNG 01–05
representan cada página. No se modificaron el servidor, los scripts, las
plantillas ni la APK. La bitácora conserva la evidencia previa.
