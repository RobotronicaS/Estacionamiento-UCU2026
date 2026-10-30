# Ampliacion: cuatro grupos independientes - 21/10/2026

Para que cada grupo instale y mantenga su propia copia, empezar por
GUIA_TRABAJO_INDEPENDIENTE.md y las paginas 6-10 del PDF. El docente ejecuta
rpi/preparar_grupos_independientes.sh; cada estudiante usa mi_grupo.py
desde su cuenta. Las paginas 1-5 y el contenido anterior se conservan
como recorrido previo. El instalador general anterior queda para el docente.
Esta ampliacion se probo localmente; falta su validacion en la Raspberry.

---

# Cómo encontrar y usar los archivos del ZIP

Proyecto Integrador 2 · Microprocesadores · UCU Salto · Jonatan Piuma

Edición: 21/10/2026. Complemento de las páginas 1–2, conservadas completas en el PDF ampliado. Las páginas 3–5 agregan el mapa de archivos y el recorrido de uso.

## 1. Qué descargar y qué abrir primero

Descargar **Estacionamiento_UCU_Paquete_Completo.zip** en Descargas de Windows. El PDF también se puede descargar por separado. El paquete contiene una copia del PDF ampliado en **laminas/Estacionamiento_UCU_Completo_A3.pdf**.

En el Explorador de archivos: Descargas → seleccionar el ZIP → Extraer todo → elegir una carpeta nueva → Extraer. Entrar en la carpeta que contiene LEEME.md y las carpetas rpi, android, laminas y evidencia. El ZIP no se ejecuta directamente.

LEEME.md y GUIA_DEL_ZIP.md son textos: abrir con Bloc de notas o un editor. COMANDOS_PARA_COPIAR.txt también se abre como texto; sus bloques se copian por separado en la terminal indicada. Las imágenes PNG sirven para visualizar o imprimir las láminas.

## 2. Mapa exacto del paquete

Todas las rutas siguientes empiezan dentro de la carpeta extraída.

| Ruta | Para qué sirve | Dónde/cuándo se usa |
|---|---|---|
| LEEME.md | Instrucciones generales, alcance, evidencia y fuentes | PC; leer primero |
| GUIA_DEL_ZIP.md | Este instructivo con rutas y comandos copiables | PC; páginas 3–5 del PDF |
| COMANDOS_PARA_COPIAR.txt | Bloques de comandos de las láminas y del anexo | Copiar un bloque a la vez; respetar PowerShell o Bash |
| laminas/Estacionamiento_UCU_Completo_A3.pdf | Dos láminas originales más tres páginas nuevas | Abrir en PC; imprimir A3 horizontal al 100 % |
| laminas/Estacionamiento_UCU_Completo_A3_01.png | Imagen de la página 1 original | PC; consulta e impresión |
| laminas/Estacionamiento_UCU_Completo_A3_02.png | Imagen de la página 2 original | PC; consulta e impresión |
| laminas/Estacionamiento_UCU_Completo_A3_03.png | Imagen del mapa de archivos | PC; página 3 del PDF |
| laminas/Estacionamiento_UCU_Completo_A3_04.png | Imagen de extracción, copia e instalación | PC; página 4 del PDF |
| laminas/Estacionamiento_UCU_Completo_A3_05.png | Imagen de reinicio, APK y rutas finales | PC; página 5 del PDF |
| rpi/instalar_estacionamiento_ucu.sh | Instalador completo: dependencias, grupos, API, servicios, túneles y pruebas | Raspberry, Bash como ucu2026; instalación nueva |
| rpi/verificar_despues_reinicio.sh | Revisa servicios y API; obtiene las URL actuales y guarda la lista si todo aprueba | Raspberry, Bash como ucu2026; sistema ya instalado |
| rpi/servidor_estacionamiento.py | Código de referencia de la API con seis plazas simuladas | Raspberry; lo ejecuta el servicio de cada grupo |
| rpi/requirements.txt | Dependencias Python: Flask y Waitress | Raspberry; pip lo usa en cada entorno virtual |
| rpi/estacionamiento@.service | Plantilla completa de arranque de las API por grupo | Configuración de systemd; no es un comando Bash |
| rpi/estacionamiento-tunel@.service | Plantilla de los cuatro túneles rápidos de Cloudflare | Configuración de systemd; no es un comando Bash |
| rpi/prueba_local.py | Comprueba las cuatro API locales, historial y rechazo de otro grupo | Raspberry, Python 3; prueba opcional |
| rpi/prueba_publica.py | Valida un JSON recién descargado: grupo, seis plazas y fecha vigente | Raspberry, Python 3; requiere número de grupo y archivo JSON |
| android/Estaciona-Salto-UCU-0.1.3.apk | Aplicación Android sin recompilar | Transferir al teléfono e instalar; Android 8 o posterior |
| evidencia/Registro_Verificacion_Estacionamiento_UCU.md | Comandos, resultados, errores corregidos y pendientes | PC; consultar evidencia de la prueba |
| SHA256SUMS.txt | Huellas SHA-256 de todos los demás archivos | Texto para comprobar integridad; no es un programa |

## 3. Extraer con PowerShell: alternativa al Explorador

Si ya se extrajo desde el Explorador, asignar `$carpeta` a la carpeta real y omitir Expand-Archive. Para encontrar esa ruta, entrar en la carpeta que contiene rpi, hacer clic en la barra de dirección del Explorador y copiarla; usar esa dirección entre comillas como valor de `$carpeta`. Si la carpeta propuesta existe, usar otra carpeta nueva para esta edición. Los comandos presuponen que el ZIP conserva su nombre exacto; si Windows lo descargó con (1), renombrarlo o corregir `$zip`.

<!-- bloque: extraer -->
```powershell
$descargas = Join-Path $env:USERPROFILE 'Downloads'
$zip = Join-Path $descargas `
  'Estacionamiento_UCU_Paquete_Completo.zip'
$carpeta = Join-Path $descargas 'Estacionamiento_UCU'
Expand-Archive -LiteralPath $zip -DestinationPath $carpeta
Get-ChildItem -LiteralPath $carpeta
```

Se deben ver LEEME.md, GUIA_DEL_ZIP.md, COMANDOS_PARA_COPIAR.txt, SHA256SUMS.txt y las cuatro carpetas. Confirmar que existen las dos entradas de trabajo:

<!-- bloque: comprobar_windows -->
```powershell
Test-Path "$carpeta\rpi\instalar_estacionamiento_ucu.sh"
Test-Path "$carpeta\rpi\verificar_despues_reinicio.sh"
```

Ambas órdenes deben devolver True. No continuar la copia si devuelven False: revisar la carpeta elegida y si hay una carpeta extra intermedia.

## 4. Copiar rpi desde Windows y entrar a la Raspberry

Prerrequisitos: Raspberry encendida, sistema instalado, SSH habilitado y usuario ucu2026 creado. La primera conexión con ucu2026.local requiere estar en la misma red local. Para una conexión remota ya autorizada por Tailscale, usar la IP obtenida con tailscale ip -4 en las dos órdenes siguientes. La IP comprobada en esta instalación fue 100.72.228.96; una instalación nueva puede tener otra.

Ejecutar en la misma ventana de PowerShell donde se definió `$carpeta`:

<!-- bloque: copiar_entrar -->
```powershell
scp -r "$carpeta\rpi" ucu2026@ucu2026.local:
ssh ucu2026@ucu2026.local
```

scp copia rpi al directorio personal de ucu2026. La copia deja los archivos en /home/ucu2026/rpi, abreviado ~/rpi cuando la sesión es de ucu2026. ssh abre la terminal de la Raspberry. Verificar la huella de host con el docente antes de aceptar una clave nueva. Las contraseñas se escriben sin caracteres visibles.

Después de ver el prompt ucu2026@UCU2026:~ $, ejecutar en Bash:

<!-- bloque: comprobar_rpi -->
```bash
whoami
ls -l ~/rpi/instalar_estacionamiento_ucu.sh \
  ~/rpi/verificar_despues_reinicio.sh
```

Debe aparecer ucu2026 y deben existir ambos archivos. Los comandos $env:USERPROFILE y Test-Path corresponden a PowerShell; no se pegan en esta sesión Bash.

## 5. Elegir una sola operación

### A. Raspberry nueva: instalar

Ejecutar como ucu2026, con acceso a sudo e Internet:

<!-- bloque: instalar -->
```bash
bash ~/rpi/instalar_estacionamiento_ucu.sh
```

El instalador solicita sudo y la contraseña de cada cuenta de grupo que falte. Instala dependencias, crea cuatro entornos Python, escribe las dos plantillas systemd, inicia cuatro API y cuatro túneles, y prueba la API local y pública. No requiere activar previamente un entorno virtual.

Si Tailscale muestra un enlace de autorización, abrirlo en el navegador y autorizar la Raspberry. Si la espera de 180 segundos termina, completar después con sudo tailscale up. Revisar cualquier mensaje PENDIENTE: que el proceso termine no demuestra por sí solo que el acceso público haya aprobado.

Los pasos 5–7 de las dos láminas originales explican las tareas que automatiza el instalador. El instalador contiene su propia copia del código Python y de las plantillas: editar los archivos sueltos del ZIP no modifica ese código incrustado. El proyecto que ejecuta cada grupo queda en /home/grupoN/PI2/estacionamiento.

### B. Raspberry ya instalada: comprobar y recuperar las URL

Esta es la operación que corresponde al sistema cuya prueba de reinicio ya aprobó:

<!-- bloque: verificar -->
```bash
bash ~/rpi/verificar_despues_reinicio.sh
cat ~/PI2_instalacion/direcciones_apk.txt
```

El verificador consulta el estado; no reinicia los servicios. Requiere que el instalador haya creado ~/PI2_instalacion y los ocho servicios. Solo reemplaza direcciones_apk.txt si las cuatro API locales y las cuatro HTTPS aprueban, junto con active/enabled y la validación de seis plazas y fecha vigente.

Resultado final esperado:

```text
=== VERIFICACION DESPUES DEL REINICIO: OK ===
Equipo 1: https://<direccion-vigente>.trycloudflare.com
Equipo 2: https://<direccion-vigente>.trycloudflare.com
Equipo 3: https://<direccion-vigente>.trycloudflare.com
Equipo 4: https://<direccion-vigente>.trycloudflare.com
```

Las direcciones entre <...> son un esquema del resultado, no texto para pegar en la APK. Usar las direcciones reales que devuelve la prueba. Si falla un paso, revisar el diagnóstico del paso 11 de la lámina 2; una lista anterior puede estar desactualizada.

## 6. Probar después de reiniciar

Esta operación es opcional si el reinicio ya fue comprobado. La ejecuta el docente. En Bash de la Raspberry:

<!-- bloque: reiniciar -->
```bash
sudo reboot
```

La sesión SSH se cierra. Cuando el equipo vuelva a estar disponible, abrir PowerShell de Windows y reconectar por Tailscale autorizado; sustituir la IP si corresponde:

<!-- bloque: reconectar -->
```powershell
ssh ucu2026@100.72.228.96
```

Ya dentro de Bash, repetir el bloque verificar del apartado 5.B. El reinicio vuelve a crear los túneles rápidos; hay que recuperar sus nuevas direcciones antes de conectar la APK.

## 7. Encontrar e instalar la APK en Android

1. En la PC, abrir la carpeta extraída → android → Estaciona-Salto-UCU-0.1.3.apk.
2. Transferir ese archivo al teléfono, por ejemplo por USB a Descargas.
3. En el teléfono, abrir Archivos → Descargas → el archivo .apk. Si Android lo solicita, autorizar la instalación para la aplicación que abre ese archivo. Requiere Android 8 o posterior.
4. Abrir la app → Ajustes → desactivar Modo demostración.
5. En Dirección del servidor HTTPS, pegar la URL base vigente del equipo que devuelve direcciones_apk.txt. Pegar solo https://...trycloudflare.com, sin /api/estado?grupo=1 y sin el prefijo Equipo 1:.
6. Elegir Equipo 1, 2, 3 o 4 según corresponda y tocar Guardar y conectar.
7. Para comprobar acceso público, usar datos móviles con Wi-Fi y Tailscale desconectados; observar las seis plazas y sus cambios.

La APK no necesita una cuenta Linux ni Tailscale. La versión incluida conserva una URL inicial antigua: cambiarla en Ajustes. Las API siguen generando datos simulados aunque se desactive Modo demostración en el teléfono.

## 8. Dónde quedan los archivos en la Raspberry

| Ruta en la Raspberry | Contenido y origen |
|---|---|
| /home/ucu2026/rpi/ | Carpeta del paquete copiada por scp; scripts y plantillas de referencia |
| /home/ucu2026/PI2_instalacion/servidor_estacionamiento.py | Código generado por el instalador a partir de su copia incrustada |
| /home/ucu2026/PI2_instalacion/requirements.txt | Requisitos generados por el instalador |
| /home/ucu2026/PI2_instalacion/direcciones_apk.txt | Cuatro URL reales; lo generan el instalador y el verificador cuando corresponde |
| /home/ucu2026/PI2_instalacion/instalacion_*.log | Registro de instalación con fecha y hora; el asterisco representa la marca temporal |
| /home/ucu2026/PI2_instalacion/estado_publico_grupoN.json | Instantánea capturada por el instalador; no garantiza que siga vigente después |
| /home/grupo1/PI2/estacionamiento/ | Proyecto real del grupo 1: servidor, requirements.txt y entorno .venv |
| /home/grupo2/PI2/estacionamiento/ | Proyecto real del grupo 2 |
| /home/grupo3/PI2/estacionamiento/ | Proyecto real del grupo 3 |
| /home/grupo4/PI2/estacionamiento/ | Proyecto real del grupo 4 |
| /etc/systemd/system/estacionamiento@.service | Plantilla instalada para arrancar las cuatro API |
| /etc/systemd/system/estacionamiento-tunel@.service | Plantilla instalada para arrancar los cuatro túneles |

Las rutas con ~ dependen de quién inició sesión: para ucu2026, ~ es /home/ucu2026; para grupo1, ~ es /home/grupo1. La carpeta ~/rpi del docente no es la carpeta donde se ejecuta el proyecto del estudiante.

Los mensajes de los servicios se consultan en el diario de systemd; no confundirlos con el registro del instalador:

<!-- bloque: diagnostico -->
```bash
sudo journalctl -u estacionamiento@1 -n 30 --no-pager
sudo journalctl -b -u estacionamiento-tunel@1 \
  -n 30 --no-pager
```

Cambiar @1 por @2, @3 o @4 según el grupo. El puerto es 5001, 5002, 5003 o 5004, respectivamente.

## 9. Pruebas opcionales de los archivos Python

Con las cuatro API funcionando, prueba_local.py usa solo la biblioteca estándar y se ejecuta en la Raspberry:

<!-- bloque: prueba_local -->
```bash
python3 ~/rpi/prueba_local.py
```

prueba_publica.py necesita dos argumentos: grupo y ruta a un JSON recién descargado. No abrir una instantánea vieja: la prueba exige lectura vigente. Ejemplo para el grupo 1, después de actualizar direcciones_apk.txt:

<!-- bloque: prueba_publica -->
```bash
url=$(sed -n 's/^Equipo 1: //p' \
  ~/PI2_instalacion/direcciones_apk.txt)
curl -fsS --connect-timeout 5 --max-time 20 \
  "$url/api/estado?grupo=1" \
  -o "$HOME/PI2_instalacion/estado_actual_grupo1.json" &&
python3 ~/rpi/prueba_publica.py 1 \
  "$HOME/PI2_instalacion/estado_actual_grupo1.json"
```

Esta es una comprobación opcional preparada; la validación pública que ejecutó el docente usó el bloque integral del verificador.

## 10. Si no encuentro algo

| Situación | Qué revisar |
|---|---|
| Test-Path devuelve False | La extracción terminó y $carpeta apunta a la carpeta que contiene rpi; evitar una carpeta intermedia extra |
| scp: stat local ... No such file | El comando se ejecuta en PowerShell de Windows y la ruta local existe |
| Bash no reconoce $env:USERPROFILE, Test-Path o Test-NetConnection | Son comandos o sintaxis de PowerShell; volver a la ventana de Windows |
| No existe ~/rpi/verificar_despues_reinicio.sh | Copiar la carpeta rpi a la cuenta ucu2026 y comprobar whoami y ls |
| No existe direcciones_apk.txt | Es un archivo generado en la Raspberry, no viene dentro del ZIP; instalar primero o revisar el verificador |
| No hay servicios o la API no responde | Consultar el paso 11 de la lámina 2 y los mensajes de journalctl; revisar el resultado del instalador |
| La app dejó de conectar después de reiniciar | Ejecutar el verificador y actualizar en Ajustes la URL del equipo |

## Alcance y conservación

Las dos páginas originales se conservan completas, con su numeración 1/2 y 2/2. Las tres páginas añadidas llevan numeración 3/5, 4/5 y 5/5. Se agregaron marcadores al PDF para navegar a cada parte.

Esta ampliación documenta el uso del paquete. Se conserva el código, la APK, las plantillas y los scripts; no se ejecutó otra instalación en la Raspberry. La prueba anterior acreditó ocho servicios, cuatro API locales y cuatro HTTPS después del reinicio. La APK funcionó según el docente antes de ese reinicio; falta confirmar el teléfono con la nueva dirección.

La demostración sigue usando seis plazas simuladas por grupo. Dominio permanente, MPF-1, sensores, pasarela, base de datos persistente y coordenadas relevadas permanecen fuera de esta instalación.
